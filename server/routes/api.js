// '/api' directory

const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const iconv1 = require('iconv').Iconv;
const iconv_lite = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

// Service Domain
const newsService=require('../domain/news.js');
const weatherService=require('../domain/weather.js');
const youtubeService = require('../domain/youtube.js');
const stockService = require("../domain/stock.js")

// DAO Domain
// const youtubeKeywordDao = require('../database/keyword/youtube.js');

// auth
const auth = require('../middleware/auth.js');

// ------------------------------------------------------------------
// Naver News API
// ------------------------------------------------------------------

// 네이버 뉴스 api를 이용해 뉴스 정보 가져옴
const request = require('request');
const { default: axios } = require('axios');

//뉴스 api
router.get('/news',newsService.getNews);//핫토픽 다음 뉴스를 크롤링을 이용해 가져옴 
router.post('/news',newsService.postNews);//키워드 기반으로 크롤링하여 뉴스 가져옴

//날씨 api
router.get(`/weather`,weatherService.getWeather);// default 위치인 서울 중구의 날씨 가져옴
router.post(`/weather`,weatherService.postWeather);//특정 위치의 날씨 가져옴

// ------------------------------------------------------------------
// YOUTUBE DATA API v3. Search
// 파라미터 가이드 : https://developers.google.com/youtube/v3/docs/search
// ------------------------------------------------------------------

// 실시간 인기 동영상
router.get('/youtube', youtubeService.popularVideo)

// 검색 결과 기반 동영상 정보
router.post('/youtube', youtubeService.searchVideo)

// ------------------------------------------------------------------
// Youtube Keyword of User
// ------------------------------------------------------------------

router.get('/youtube/keyword', auth.isLogin, async (req, res) => {
  let user = null;
  let keywordList = new Array();

  try {
    user = await User.findOne({_id:req.session.passport.user});
  } catch (err) {
    console.error("not Logined");
    res.status(504).send("Not Logined");
  }

  if (user.youtubeKeyword.length == 0){
    res.status(200).send("NO DATA");
  }else{
    for(var i = 0; i < user.youtubeKeyword.length; i++){
      keywordList.push(user.youtubeKeyword[i]);
    }
    res.send(keywordList);
  }
})
router.delete('/youtube/keyword', auth.isLogin, async (req, res) => {
  if (!auth.isLogin()){
    console.log("Not Logined");
    res.status(200).send("Not Logined");
  }
  try {
    result = await User.updateOne({_id:req.session.passport.user}, {$pull: {youtubeKeyword : req.body.keyword}});
    console.log(req.body.keyword + " is Deleted");
    res.status(200).send("DELETE SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(504).send("Delete Keyword ERROR");
  }
})

// ------------------------------------------------------------------
// STOCK DATA FROM NAVER FINANCE
// ------------------------------------------------------------------

// 거래량 상위 종목
router.get('/stock', stockService.getTradingVolumeTop5Stock)

// 종목별 카드에 담길 데이터
router.post('/stock', stockService.getStockInfo)

// ------------------------------------------------------------------
// Stock Keyword of User
// ------------------------------------------------------------------

router.get('/stock/keyword', auth.isLogin, async (req, res) => {
  let user = null;
  let keywordList = new Array();

  try {
    user = await User.findOne({_id:req.session.passport.user});
  } catch (err) {
    console.error(err);
    res.status(504).send("USER NOT FOUND");
  }

  if (user.stockKeyword.length == 0){
    res.status(200).send("NO DATA");
  }else{
    for(var i = 0; i < user.stockKeyword.length; i++){
      keywordList.push(user.stockKeyword[i]);
    }
    res.send(keywordList);
  }
})

router.delete('/stock/keyword', auth.isLogin, async (req, res) => {

  try {
    let result = await User.updateOne({_id:req.session.passport.user}, {$pull: {stockKeyword : req.body.keyword}});
    console.log(req.body.keyword + " is Deleted");
    res.status(200).send("DELETE SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(504).send("Delete Keyword ERROR");
  }
})


router.get('/indices', (req, res) => {
  let apiUrl = "https://finance.naver.com/";
  const indicesInfo = [];
  axios({
    url: apiUrl,
    method: "GET",
    responseType: "arraybuffer"
  }).then((response) => {
    const convert = iconv_lite.decode(response.data, 'EUC-KR');
    const $ = cheerio.load(convert);

    // KOSPI
    let kospiInfo = {};
    let kospiIndexValue = $('.kospi_area > .heading_area .num_quot').find('.num').text().trim();
    let changeKospiIndex = $('.kospi_area > .heading_area .num_quot').find('.num2').text().trim();
    let changeKospiRate = $('.kospi_area > .heading_area .num_quot').find('.num3').text().trim();
    let kospiDir = $('.kospi_area > .heading_area .num_quot > .num3').find('.blind').text().trim();
    let kospiDirText = $('.kospi_area > .heading_area .num_quot').find('.blind').text().trim();

    kospiInfo["title"] = "KOSPI";
    kospiInfo["value"] = kospiIndexValue;
    kospiInfo["changeIndex"] = kospiDir + changeKospiIndex;
    kospiInfo["changeRate"] = changeKospiRate;
    kospiInfo["dir"] = kospiDirText[1] + kospiDirText[2];
    indicesInfo.push(kospiInfo);

    // KOSDAQ
    let kosdaqInfo = {};
    let kosdaqIndexValue = $('.kosdaq_area > .heading_area .num_quot').find('.num').text().trim();
    let changeKosdaqIndex = $('.kosdaq_area > .heading_area .num_quot').find('.num2').text().trim();
    let changeKosdaqRate = $('.kosdaq_area > .heading_area .num_quot').find('.num3').text().trim();
    let kosdaqDir = $('.kosdaq_area > .heading_area .num_quot > .num3').find('.blind').text().trim();
    let kosdaqDirText = $('.kosdaq_area > .heading_area .num_quot').find('.blind').text().trim();

    kosdaqInfo["title"] = "KOSDAQ";
    kosdaqInfo["value"] = kosdaqIndexValue;
    kosdaqInfo["changeIndex"] = kosdaqDir + changeKosdaqIndex;
    kosdaqInfo["changeRate"] = changeKosdaqRate;
    kosdaqInfo["dir"] = kosdaqDirText[1] + kosdaqDirText[2];
    indicesInfo.push(kosdaqInfo);

    res.send(indicesInfo);
  })
})

// Crypto Info (Upbit)
let coinCode = {};

fs.readFile('../server/data/coinCode.json', 'utf8', (err, jsonFile) => {
  if(err) return console.log(err);
  coinCode = JSON.parse(jsonFile);    
  console.log("CoinCode Load Fin!");
})

router.get('/coin', (req, res) => {
  // 거래량 상위 5종목
  // 코드 난독화로 크롤링 불가능
  // Upbit OPEN API로 변경 예정(21.12.23)
  var url = `https://upbit.com/exchange?code=CRIX.UPBIT.KRW-BTC`; 
  request({url, encoding:null}, (err, response, body) => {
    let iconv = new iconv1('euc-kr', 'utf-8//translit//ignore');    
    let htmlDoc = iconv.convert(body).toString('utf-8');
    let htmlDocBin = new Buffer(htmlDoc, 'binary');
    let htmlDocUtf8 = iconv.convert(htmlDocBin).toString('utf-8');
    const $ = cheerio.load(htmlDocUtf8);
    const topTradingCoinList = {};
    for(var rank = 1; rank <= 5; rank++)
    $(`.scrollB > div > div > table > tbody > tr:nth-of-type(${rank})`).map((i, element) => {
      let titleKor = $(element).find('td:nth-of-type(3) > a > strong').text().trim();
      let titleEng = $(element).find('td:nth-of-type(3) > a > em').text().trim();
      let price = $(element).find('td:nth-of-type(4) > strong').text().trim();
      let changePrice = $(element).find('td:nth-of-type(5) > em').text().trim();
      let changeRate = $(element).find('td:nth-of-type(5) > p').text().trim();
      const coinJson = {};
      coinJson['titleKor'] = titleKor;
      coinJson['titleEng'] = titleEng;
      coinJson['price'] = price;
      coinJson['changePrice'] = changePrice;
      coinJson['changeRate'] = changeRate;
      topTradingCoinList[rank] = coinJson;
    })
    res.status(200);
    res.send(topTradingCoinList);
  })
})

router.post('/coin', (req, res) => {
  // 기준 화폐 단위 - 종목코드로 원하는 종목 탐색 가능 
  const code = coinCode[req.body.keyword]
  const coinInfo = {};
  if(code === null){
    coinInfo['err'] = "Noname";
    res.status(200);
    res.send(coinInfo);
  }else {
    var url = `https://crix-api-endpoint.upbit.com/v1/crix/candles/days/?code=CRIX.UPBIT.KRW-` + code; // Upbit API
    request.get(url, (err, response, body) => {      
      data = JSON.parse(body);
      coinInfo['title'] = req.body.keyword;
      coinInfo['tradePrice'] = data[0]['tradePrice'];
      coinInfo['changePrice'] = data[0]['signedChangePrice'];
      coinInfo['changeRate'] = Math.round(data[0]['signedChangeRate'] * 10000) / 100;
      coinInfo['url'] = "https://upbit.com/exchange?code=CRIX.UPBIT.KRW-" + code;
      res.status(200);
      res.send(coinInfo);
    });
  }    
})

module.exports = router; //exports구문 추가