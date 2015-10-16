var fs = require('fs');

var config = {
    wordpress_url: 'http://127.0.0.1/wp/',
    wordpress_username: 'USERNAME',
    wordpress_password: 'PASSWD',
    wordpress_post_title: (new Date().getFullYear()) + ' 年 第 ' + (new Date().getWeek()) + ' 週 Facebook 同步週報 (MXPPOSTCOUNT 篇)',
    wordpress_post_status: 'publish', //publish, draft, pending, private ref: http://codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.getPostStatusList
    wordpress_post_author: 1, //admin? that's it.
    wordpress_post_header: '<h3>本文引用圖文皆取自[<a href="https://www.facebook.com/a.tech.guy">一介資男</a>]Facebook粉專頁面，如有侵權請[<a href="https://www.mxp.tw/contact/">來信</a>]告知。</h3><br/>',
    wordpress_post_content: '<p><b>MXPCOUNTNUM</b></p>MPXPOSTPIC<blockquote><p>MXPPOSTMSG</p></blockquote><p><a href="https://www.facebook.com/MXPPOSTID">MXPPOSTCREATEDTIME 發佈</a> | <a href="MXPPOSTLINK">內文分享連結</a></p>',
    wordpress_post_footer: '<p>以上資訊由 <a href="https://github.com/nczz/FB2WP">FB轉發機器人V2.0</a> 彙整發佈。</p>',
    wordpress_post_category: ['Facebook同步備份'],//go wp-admin/edit-tags.php?taxonomy=category and look the name.
    wordpress_post_tags: ['Facebook'], //the default tag
    facebook_graph_api: 'https://graph.facebook.com/v2.5/',
    facebook_page_name: 'a.tech.guy',//'cyberbuzz', //ID or Name
    facebook_app_access_token: 'FACEBOOKAPPACCESSTOKEN', //ref: https://developers.facebook.com/docs/facebook-login/access-tokens#extending
    facebook_posts_fields: 'link,message,picture,description,created_time', //ref: https://developers.facebook.com/docs/graph-api/reference/v2.5/post
    system_post_period_day: 7, //default 1 week
    system_time_to_go: false,
    system_now: Math.floor(new Date() / 1000)
};

var last_time = null;
var time_diff = config.system_post_period_day*86400;

module.exports = function(cb){
    fs.readFile('./time.log', 'utf8', function (err,data) {
        if (err) {
            fs.writeFile('./time.log', config.system_now, function(err) {
                if(err) {
                    return GLOBAL.methods.debug('FB2WP: file system error.');
                }
                GLOBAL.methods.debug('FB2WP: Time log file was created!');
                //the first round
                config.system_time_to_go = true;
                config.system_since = config.system_now-time_diff;
                cb(config);
            }); 
        } else {
            last_time = parseInt(data, 10);
            if (isNaN(last_time)){
                return GLOBAL.methods.debug('FB2WP: syntax error, time.log should be in timestamp format.');
            }
            if (config.system_now-last_time>time_diff){
                GLOBAL.methods.debug('FB2WP: Need to update.');
                config.system_time_to_go = true;
                config.system_since = last_time;
            } else {
                GLOBAL.methods.debug('FB2WP: Not yet');
                config.system_time_to_go = false;
            }
            cb(config);
        }
    });
}
