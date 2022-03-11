
const User = require('../models/User');

exports.findAll = async (req, res) => {
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
}

exports.deleteOne = async (req, res) => {
    try {
        result = await User.updateOne({_id:req.session.passport.user}, {$pull: {youtubeKeyword : req.body.keyword}});
        console.log(req.body.keyword + " is Deleted");
        res.status(200).send("DELETE SUCCESS");
      } catch (err) {
        console.error(err);
        res.status(504).send("Not Logined || Keyword ERROR");
      }
}