const express  = require('express');
const router   = express.Router();
const passport = require('../config/passport.js');

router.get('/', (req, res) => {//로그인 상태 확인
  res.header("Access-Control-Allow-Origin", "http://localhost:8000");
  res.header("Access-Control-Allow-Credentials", "true");

    if(req.user){
        console.log(req.user);
        res.status(200);
        res.send(req.user);
    }else{
        res.status(504);
        res.send(false);
    }
})

router.get('/test', (req, res) => {
  res.send("Failure Redirected from passport");
})

router.get('/login', (req,res) => {
  res.render('auth/login');
});

router.get('/logout', (req,res) =>  {
  req.logout();
  req.session.destroy();
  res.redirect('http://localhost:8000/');
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile'] }) // 구글이 제공해주는 프로필에 대해 req
  
);

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/test'
  }), 
  (req, res) => {
  console.log(req.user);
  console.log("로그인 완료");
  res.header("Access-Control-Allow-Origin", "http://localhost:8000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.redirect("http://localhost:8000");
});

module.exports = router;