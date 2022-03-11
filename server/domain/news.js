const cheerio = require('cheerio');
const axios = require('axios');

exports.getNews=async(req,res)=>{
    const url=`https://news.daum.net/`;
    const options={
      url: url,
      method: 'get',
    };
  
    axios(options).then((response)=>{
      if(response.status === 200){
        const $=cheerio.load(response.data);
        const newsResult=[];
        const list_arr=$(".item_issue");
        list_arr.map((idx,li)=>{
        if(idx<4){
          newsResult[idx]={
            url: $(li).find("a").attr('href'),
            thumb: $(li).find("a>img").attr('src'),
            title:$(li).find(".cont_thumb>.tit_g>a").text(),
            comp:$(li).find(".cont_thumb>.info_thumb>.logo_cp>img").attr('alt'),
          }
        }
        })
        res.status(200);
        res.send(newsResult);
      }
    }).catch((error)=>{
      console.error(error);
    });

}

exports.postNews=async(req,res)=>{
    const url=`https://search.naver.com/search.naver?where=news&sm=tab_jum&query=${encodeURI(req.body.keyword)}`;
    const options={
      url: url,
      method: 'get'
    };
    axios(options).then((response)=>{
      if(response.status === 200){
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
}