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
const youtubeService = require('../domain/youtube.js');
const stockService = require("../domain/stock.js")

// DAO Domain
const youtubeKeywordDao = require('../database/keyword/youtube.js');

// ------------------------------------------------------------------
// Naver News API
// ------------------------------------------------------------------

// 네이버 뉴스 api를 이용해 뉴스 정보 가져옴
const request = require('request');
const { default: axios } = require('axios');

router.get('/news',async(req,res)=>{//핫토픽 다음 뉴스를 크롤링을 이용해 가져옴 
  const url=`https://news.daum.net/`;
  const options={
    url: url,
    method: 'get',
  };

  axios(options).then((response)=>{
    if(response.status == 200){
      const $=cheerio.load(response.data);
      const newsResult=[];
      const list_arr=$(".item_issue");
      list_arr.map((idx,li)=>{
        newsResult[idx]={
          url: $(li).find("a").attr('href'),
          thumb: $(li).find("a>img").attr('src'),
          title:$(li).find(".cont_thumb>.tit_thumb>a").text(),
          comp:$(li).find(".cont_thumb>.info_thumb").text(),
        }
      })
      res.status(200);
      res.send(newsResult);
    }
  }).catch((error)=>{
    console.error(error);
  });
});


router.post('/news',(req,res)=>{//키워드 기반으로 크롤링하여 뉴스 가져옴
  const url=`https://search.naver.com/search.naver?where=news&sm=tab_jum&query=${encodeURI(req.body.keyword)}`;
  const options={
    url: url,
    method: 'get'
  };
  axios(options).then((response)=>{
    if(response.status == 200){
      //원래 인코딩이 utf-8이라 iconv 사용하지않음
      const $=cheerio.load(response.data);
      const newsResult=[];
      const list_arr=$(".list_news>li>.news_wrap");
      list_arr.map((idx, div)=>{
        newsResult[idx]={
          title: $(div).find(".news_tit").attr("title"),
          url:$(div).find(".news_tit").attr("href"),
          description:$(div).find(".news_dsc").text().trim(),
          thumb:$(div).find(".dsc_thumb>img").attr("src"),
          comp:$(div).find("a.info.press").text().replace("언론사 선정",''),
        }
      })
      res.send(newsResult);
    }
  }).catch((error)=>{
    console.error(error);
  });
});



router.get(`/weather`,(req,res)=>{// default 위치인 서울 중구의 날씨 가져옴
  const url=`https://api.openweathermap.org/data/2.5/weather?lat=37.5555892070291&lon=126.981204133005&appid=${process.env.WEATHER_API_KEY}`;
  axios.get(url).then((response)=>{
    if(response.status==200){
      const result= response.data;
      const weatherResult={
        main : result.main,
        icon : `http://openweathermap.org/img/wn/${result.weather[0].icon}@2x.png`,
        addr : `서울특별시 중구 회현동1가`,
      }
      res.status(200).set('charset=utf-8');  
      res.send(weatherResult); //string 값으로 받아옴
    }
  }).catch((error)=>{
    console.log(error);
  });
});

router.post(`/weather`,(req,res)=>{//특정 위치의 날씨 가져옴
  const{location}=req.body;
 // const url=`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${process.env.WEATHER_API_KEY}`;
  const url=`https://api.openweathermap.org/data/2.5/weather`;
  const params={
    lat:location.lat,
    lon:location.lon,
    appid:process.env.WEATHER_API_KEY,
  };
  const options={
    url:url,
    method:'get',
    params:params,
  };
  axios(options).then((response)=>{
    if(response.status==200){
      const result= response.data;
      const weatherResult={
        main : result.main,
        icon : `http://openweathermap.org/img/wn/${result.weather[0].icon}@2x.png`,
        addr : location.address,
      }
      res.status(200).set('charset=utf-8');  
      res.send(weatherResult); //string 값으로 받아옴
    }
  }).catch((error)=>{
    console.log(error);
  })
});

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

router.get('/youtube/keyword', async (req, res) => {
  let user = null;
  try {
    user = await User.findOne({_id:req.session.passport.user});
    console.log(user + "'s Youtube Keyword Search is Successed");
  } catch (err) {
    console.error(err);
    res.status(504).send("Not Logined");
  }

  if (user.youtubeKeyword.length == 0){
    res.status(200).send("NO DATA");
  }else{
    let keywordList = new Array();
    for(var i = 0; i < user.youtubeKeyword.length; i++){
      keywordList.push(user.youtubeKeyword[i]);
    }
    res.send(keywordList);
  }
})
router.delete('/youtube/keyword', async (req, res) => {
  try {
    result = await User.updateOne({_id:req.session.passport.user}, {$pull: {youtubeKeyword : req.body.keyword}});
    console.log(req.body.keyword + " is Deleted");
    res.status(200).send("DELETE SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(504).send("Not Logined || Keyword ERROR");
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

router.get('/stock/keyword', async (req, res) => {
  let user = null;
  try {
    user = await User.findOne({_id:req.session.passport.user});
    console.log(user + "'s Stock Keyword Search is Successed");
  } catch (err) {
    console.error(err);
    res.status(504).send("Not Logined");
  }

  if (user.stockKeyword.length == 0){
    res.status(200).send("NO DATA");
  }else{
    let keywordList = new Array();
    for(var i = 0; i < user.stockKeyword.length; i++){
      keywordList.push(user.stockKeyword[i]);
    }
    res.send(keywordList);
  }
})

router.delete('/stock/keyword', async (req, res) => {
  try {
    let result = await User.updateOne({_id:req.session.passport.user}, {$pull: {stockKeyword : req.body.keyword}});
    console.log(req.body.keyword + " is Deleted");
    res.status(200).send("DELETE SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(504).send("Not Logined || Keyword ERROR");
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