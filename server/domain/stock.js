const cheerio = require('cheerio');
const iconv1 = require('iconv').Iconv;
const iconv_lite = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const axios = require('axios');
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

// load StockDirection (상한, 하한)
let stockDirection = {}
fs.readFile('../server/data/stockDirection.json', 'utf8', (err, jsonFile) => {
  if(err) return console.log(err);
  stockDirection = JSON.parse(jsonFile);    
  console.log("StockDirection Load Fin!");
})

exports.getTradingVolumeTop5Stock = (req, res) => {
    const startTr = 3; // 종목 시작 카운트
    const topTradingStockNum = 5; // 거래량 상위 n개 종목

    const apiUrl = "https://finance.naver.com/sise/sise_quant.nhn";
  axios({
    url: apiUrl,
    method: 'GET',
    responseType: "arraybuffer"
  }).then((response) => {
    const convert = iconv_lite.decode(response.data, 'EUC-KR');
    const $ = cheerio.load(convert);    
    const topTradingStockList = [];

    for(var j = startTr; j < startTr + topTradingStockNum; j++){
      $(`.type_2 > tbody > tr:nth-of-type(${j})`).map((i, element) => {
        let rank = (j - startTr + 1) + "위";
        let dir = $(element).find('td:nth-of-type(4)').find('img').toString();
        if(dir.length == 0) dir = "보합";
        else dir = stockDirection[$(element).find('td:nth-of-type(4)').find('img').attr('src').toString()];
        let changePrice = $(element).find('td:nth-of-type(4)').find('span').text().trim();
        let changeRate = $(element).find('td:nth-of-type(5)').find('span').text().trim();
        if(dir === "상승" || dir === "상한") changePrice = "+" + changePrice;
        else if (dir === "하락" || dir === "하한") changePrice = "-" + changePrice;
        let stockJson = {};
        let title = $(element).find('td:nth-of-type(2)').find('a').text().trim();
        let price = $(element).find('td:nth-of-type(3)').text().trim();
        stockJson["rank"] = rank;
        stockJson["title"] = title;
        stockJson["price"] = price;
        stockJson["dir"] = dir;
        stockJson["changePrice"] = changePrice;
        stockJson["changeRate"] = changeRate;
        stockJson["url"] = stockCodeUrl[title];
        topTradingStockList.push(stockJson);
      })
    }
    res.status(200);
    res.send(topTradingStockList);
  })
}

let stockCodeUrl = {};
fs.readFile('../server/data/stockCodeUrl_pc.json', 'utf8', (err, jsonFile) => {
    if(err) return console.log(err);
    stockCodeUrl = JSON.parse(jsonFile);    
    console.log("StockCode Load Fin!");
})

exports.getStockInfo = async (req, res) => {
    const title = req.body.keyword;
  try{
    const dbRes = await User.updateOne({_id:req.session.passport.user}, {$addToSet: {stockKeyword: title}});
  } catch (err) {
    console.log(err);
  }
  const apiUrl = stockCodeUrl[title];
  const stockInfo = {};
  if(apiUrl === undefined) {
    stockInfo['err'] = 'Noname';
    res.send(stockInfo)
  }
  else{
    axios({
      url: apiUrl,
      method: "GET",
      responseType: "arraybuffer"
    }).then((response) => {
      const convert = iconv_lite.decode(response.data, 'EUC-KR');
      const $ = cheerio.load(convert);
      let priceFragments = "", changePriceFragments = "", changeRateFragments = "", priceOfYesterday = "", topPrice = "", tradingVolume = "",
        upperLimit = "";
      $('#chart_area > .rate_info > .today > .no_today > em').map((i, element) => {
        priceFragments += $(element).find('span').text().trim();
      })
      $('#chart_area > .rate_info > .today > .no_exday > em:nth-of-type(1)').map((i, element) => {
        changePriceFragments += $(element).find('span').text().trim();
      })
      $('#chart_area > .rate_info > .today > .no_exday > em:nth-of-type(2)').map((i, element) => {
        changeRateFragments += $(element).find('span').text().trim();
      })
      $('#chart_area > .rate_info > .no_info > tbody > tr:nth-of-type(1) > td > em').map((i, element) => {
        switch(i){
          case 0:
            priceOfYesterday += $(element).find('span').text().trim();
            priceOfYesterday = priceOfYesterday.substring(0, priceOfYesterday.length / 2);
            break
          case 1:
            topPrice += $(element).find('span').text().trim();
            topPrice = topPrice.substring(0, topPrice.length / 2);
            break
          case 2:
            upperLimit += $(element).find('span').text().trim();
            upperLimit = upperLimit.substring(0, upperLimit.length / 2);
            break
          case 3:
            tradingVolume += $(element).find('span').text().trim();
            tradingVolume = tradingVolume.substring(0, tradingVolume.length / 2);
            break
        }
      })      
      let capitalization = $('#tab_con1 > .first > table > tbody > tr:nth-of-type(1) > td > em').text();
      let capitalizationRank = $('#tab_con1 > .first > table > tbody > tr:nth-of-type(2) > td').text().trim();     

      let price = priceFragments.substring(0, priceFragments.length / 2);
      let dir = changePriceFragments.substring(0, 2);
      let changePrice = ""
      if(dir === "상승") changePrice += "+";
      else if(dir === "하락") changePrice += "-";
      changePrice += changePriceFragments.substring(2, changePriceFragments.length / 2 + 1);
      let changeRate = changeRateFragments.substring(0, changeRateFragments.length / 2) + "%";
      stockInfo["title"] = title; // 종목명
      stockInfo["price"] = price; // 현재가
      stockInfo["changePrice"] = changePrice; // 등락액
      stockInfo["changeRate"] = changeRate; // 등락률
      stockInfo["dir"] = dir; // 방향  
      stockInfo["priceOfYesterday"] = priceOfYesterday; // 전일종가  
      // stockInfo["topPrice"] = topPrice; // 금일 고가 
      // stockInfo["upperLimit"] = upperLimit; // 상한가  
      stockInfo["tradingVolume"] = tradingVolume; // 거래량
      stockInfo["capitalization"] = capitalization.replace(/(\s*)/g,"") +"억원"; // 시가총액
      stockInfo["capitalizationRank"] = capitalizationRank; // 시가총액 순위
      stockInfo["url"] = apiUrl; // 사이트 링크
      res.status(200);
      res.send(stockInfo);
    })
  }  
}