var wordpress = require('wordpress');
var request = require('request');
var twitter = require('twitter-text');
var methods = GLOBAL.methods = require('./methods.js');
require('./config.js')(function(config){
	
	var wp = wordpress.createClient({
		'url': config.wordpress_url,
		'username': config.wordpress_username,
		'password': config.wordpress_password
	});

	if (!config.system_time_to_go)return methods.debug('FB2WP: No need to update.');
	methods.debug('FB2WP: Time to update.');
	request.post({
			url: config.facebook_graph_api+config.facebook_page_name+'/posts',
			form: {
				since: config.system_since,
				access_token: config.facebook_app_access_token,
				method: 'GET',
				limit: '100', //MAX
				fields: config.facebook_posts_fields
			}
		},
		function(err, httpResponse, body) {
			if (err) {
				methods.debug('FB2WP: Request Err->', err);
				return;
			}
			var items = JSON.parse(body);
			var p = typeof items.data != 'undefined' ? items.data : [];
			if (p.length == 0) {
				methods.debug('FB2WP: Facebook Err->', items);
				return;
			}
			var content = [];
			
			for (var i = 0; i < p.length; ++i) {
				var tags = twitter.extractHashtags(twitter.htmlEscape(p[i].message));
				if (tags.indexOf('MURMUR')>-1){ continue; }
				Array.prototype.push.apply(config.wordpress_post_tags,tags);
				var tmp = config.wordpress_post_content;
				content.push(tmp.replace(/MXPCOUNTNUM/,(content.length+1)+'.')
							.replace(/MPXPOSTPIC/,typeof p[i].picture == 'undefined'?'':'<p><img src="' + p[i].picture + '" alt="' + p[i].description + '">(圖片描述：'+(typeof p[i].description=='undefined'?'無':p[i].description.substring(0,30)+'...')+')</p>')
							.replace(/MXPPOSTMSG/,p[i].message)
							.replace(/MXPPOSTID/,p[i].id)
							.replace(/MXPPOSTCREATEDTIME/,new Date(p[i].created_time).toISOString().replace(/T/, ' ').replace(/\..+/, ''))
							.replace(/MXPPOSTLINK/,typeof p[i].link == 'undefined' ? '#' : p[i].link)
							//javascript unicode issue 
							//[faultCode] => -32700 [faultString] => parse error. not well formed
							.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/,'')
							.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/,''));
			}
			config.wordpress_post_title = config.wordpress_post_title.replace(/MXPPOSTCOUNT/,content.length);
			config.wordpress_post_content = content.join('');;
			
			wp.newPost({
					title: config.wordpress_post_title,
					status: config.wordpress_post_status,
					content: config.wordpress_post_header+config.wordpress_post_content+config.wordpress_post_footer,
					author: config.wordpress_post_author,
					termNames: {
						'post_tag': config.wordpress_post_tags,
						'category': config.wordpress_post_category
					}
				},
				function(err, resp) {
					if(err){
						return methods.debug('FB2WP: WordPress Err->', err);
					}
					methods.debug('FB2WP: Done.',resp);
					methods.see_u_next_time(config.system_now);
				}
			);
		}
	);
});