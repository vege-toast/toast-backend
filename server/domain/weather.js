const axios = require('axios');


exports.getWeather=async(req,res)=>{
  const url=`https://api.openweathermap.org/data/2.5/weather?lat=37.5555892070291&lon=126.981204133005&appid=${process.env.WEATHER_API_KEY}`;
  axios.get(url).then((response)=>{
    if(response.status===200){
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
}

exports.postWeather=async(req,res)=>{
    const location = req.body;
    console.log("위치정보 : " + location.lon + location.lat);
    
    const locationUrl=`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${location.lon}&y=${location.lat}`;
    const options={
      url:locationUrl,
      type:'get',
      method:'get',
      headers: {'Authorization' : `KakaoAK ${process.env.KAKAO_LOCATION_API_KEY}`}
    };
    axios(options).then((response)=>{
      if(response.status === 200){
        console.log(response.data);
        const {documents}=response.data;
        let address;
        if(documents[0].road_address){
          address=documents[0].road_address.address_name;
        }else{
          address=documents[0].address.address_name;
        }
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
        console.log(address);
        axios(options).then((response)=>{
          if(response.status===200){
            const result= response.data;
            const weatherResult={
              main : result.main,
              icon : `http://openweathermap.org/img/wn/${result.weather[0].icon}@2x.png`,
              addr : address,
            }
            res.status(200).set('charset=utf-8');  
            res.send(weatherResult); //string 값으로 받아옴
          }
        }).catch((error)=>{
          console.log(error);
        });
        console.log()
      }
    }).catch((error)=>{
      console.log(error);
    });
}