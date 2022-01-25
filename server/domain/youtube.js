
const path = require('path');
const axios = require('axios');
const User = require('../models/User');
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

exports.popularVideo = (req, res) => {
    var apiUrl = "https://www.googleapis.com/youtube/v3/videos?";
    var displayNum = 4;
    var optionParams = {
        part:"snippet",
        chart:"mostPopular",
        regionCode:"kr",
        key:process.env.GCP_API_KEY,
        maxResults: displayNum
    };

    for(var option in optionParams){
        apiUrl += option + "=" + optionParams[option]+"&";
    }
  
    apiUrl = apiUrl.substring(0, apiUrl.length - 1);

    var videoBaseUrl = "https://www.youtube.com/watch?v=";

    axios({
        url: apiUrl,
        method: 'GET'
    }).then((response) => {    
        result = response.data;
        // result = JSON.parse(res.data);
        const videoInfoList = [];
        for(var i = 0; i < displayNum; i++){
            const videoInfo = {};
            // 썸네일 사이즈 (defauit : 120x90 / medium : 320x180 / high : 480x360)
            videoInfo["title"] = result["items"][i]["snippet"]["title"];
            // videoInfo["description"] = result["items"][i]["snippet"]["description"];
            videoInfo["channelTitle"] = result["items"][i]["snippet"]["channelTitle"];
            videoInfo["thumbnails"] = result["items"][i]["snippet"]["thumbnails"]["high"]["url"]; 
            videoInfo["videoUrl"] = videoBaseUrl + result["items"][i]["id"];
            videoInfoList.push(videoInfo);
        }
        res.send(videoInfoList);
    })
};

exports.searchVideo = async (req, res) => {
    var keyword = req.body.keyword;
        
    try {
        const dbRes = await User.updateOne({_id:req.session.passport.user}, {$addToSet: {youtubeKeyword: keyword}});
    } catch (err) {
        // 비로그인은 키워드 저장 과정 없이 에러처리 후 영상만 제공, 모듈을 찢는 과정이 필요
        console.log(err);
    }

    // 검색 필터 기준값
    // order, relevance.. 등
    var filter = "relevance";
    var displayNum = 10;

    var optionParams = {
        part:"snippet",
        type:"video",
        order:filter,
        key:process.env.GCP_API_KEY,
        maxResults:displayNum
    };

    let multiKeyword = ""
    for (let i = 0; i < keyword.length; i++){
        searchKeyword = keyword[i];
        // 한글 검색어 사용시 인코딩 필요 + 멀티쿼리
        multiKeyword += encodeURI(searchKeyword) + "|"
    }
    multiKeyword = multiKeyword.substring(0, multiKeyword.length - 1);
    optionParams.q = multiKeyword;

    var apiUrl = "https://www.googleapis.com/youtube/v3/search?";
  
    for (var option in optionParams){
        apiUrl += option + "=" + optionParams[option]+"&";
    }
  
    apiUrl = apiUrl.substring(0, apiUrl.length - 1);

    var videoBaseUrl = "https://www.youtube.com/watch?v=";
  
    axios({
        url: apiUrl,
        method: 'GET',
    }).then((response) => {
        result = response.data;
        const videoInfoList = [];
        for(var i = 0; i < displayNum; i++){
            const videoInfo = {};
            // 썸네일 사이즈 (defauit : 120x90 / medium : 320x180 / high : 480x360)
            videoInfo["title"] = result["items"][i]["snippet"]["title"];
            videoInfo["description"] = result["items"][i]["snippet"]["description"];
            videoInfo["channelTitle"] = result["items"][i]["snippet"]["channelTitle"];
            videoInfo["thumbnails"] = result["items"][i]["snippet"]["thumbnails"]["high"]["url"]; 
            videoInfo["videoUrl"] = videoBaseUrl + result["items"][i]["id"]["videoId"];
            videoInfoList.push(videoInfo);
        }
        res.send(videoInfoList);
    })
};