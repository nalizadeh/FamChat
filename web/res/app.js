// Copyright (c) 2019 nalizadeh.org
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

//=======================================================
// Public settings (needs to be adapted to your network)
//=======================================================

const MY_DOMAIN = "nalizadeh.dynv6.net";
const MY_HTTP_PORT = "8080";
const MY_HTTPS_PORT = "443";
const MY_WS_PORT = "8181";
const MY_WSS_PORT = "444";

//===============================
// Concurrency
//===============================

var QUEUE = [];
var ACTIVE = false;

function showLoading(show, message, callback) {

	var loading = document.getElementById("loading");

	if (show) {
		if (ACTIVE) {
			QUEUE.push({msg:message, cb:callback});
		}
		else {
			ACTIVE = true;
			loading.style.display = "inline";
			sendMessage(message, function(data) {
				showLoading(false);
				callback(data);
			});
		}
	}
	else {
		ACTIVE = false;
		loading.style.display = "none";
		if (QUEUE.length > 0) {
			var queue = QUEUE.shift();
			showLoading(true, queue.msg, queue.cb);
		}
	}
}

//===============================
// WebSocket
//===============================

const MYWEB_1 = "http://localhost:" + MY_HTTP_PORT + "/";
const MYWEB_2 = "http://" + MY_DOMAIN + ":" + MY_HTTP_PORT + "/";
const MYWEB_3 = "https://" + MY_DOMAIN + ":" + MY_HTTPS_PORT + "/";

const MYWEBS_1 = "ws://localhost:" + MY_WS_PORT + "/";
const MYWEBS_2 = "ws://" + MY_DOMAIN + ":" + MY_WS_PORT + "/";
const MYWEBS_3 = "wss://" + MY_DOMAIN + ":" + MY_WSS_PORT + "/";

const REQUEST_TYPES = {
	InitUsers: 100,
	InitGroups: 101,
	Open: 102,
	Close: 103,
	Login: 104,
	LoginCookie: 105,
	Logout: 106,
	GetUser: 107,
	GetGroup: 108,
	GetAllUsers: 109,
	GetAllGroups: 110,
	GetGroups: 111,
	CreateUser: 112,
	DeleteUser: 113,
	UpdateUser: 114,
	GetContacts: 115,
	AddContact: 116,
	RemoveContact: 117,
	AddGroup: 118,
	RemoveGroup: 119,
	CreateGroup: 120,
	UpdateGroup: 121,
	DeleteGroup: 122,
	AddToGroup: 123,
	RemoveFromGroup: 124,
	GetChannel: 125,
	ReadChat: 126,
	WriteChat: 127,
	DeleteChat: 128,
	UpdateChat: 129,
	ReceivedChat: 130,
	ForwardChat: 131,
	DownloadFile: 132,
	UploadFile: 133,
	ResetPassword: 134,
	Reboot: 1000
};

const RESPONSE_TYPES = {
	OK: 0,
	ERROR: 1,
	CONN_OPENED: 2,
	CONN_CLOSED: 3,
	USER_LOGIN: 4,
	USER_LOGOUT: 5,
	USER_UPDATED: 6,
	CHAT_SENT: 7,
	CHAT_RECEIVED: 8,
	CHAT_DELETED: 9,
	CHAT_UPDATED: 10
};

var MYWEB,
	MYWEBS,
	FILESURL,
	SOCKET,

	onCallback = null,

	USERNAME = null,
	USAVATAR = null,
	CHANNEL = null,
	CHAVATAR = null,

	CHATTIME = 0,
	CHATPOS = 0,
	CHATMAX = 10,
	CHATS = [],
	SEARCHCHANNEL = "",

	GROUPS = null,

	UPDATING = false,
	UPLOADING = false,
	UPDATELOOP = false;

//======= INIT ========

function startFamChat(type, testing) {
	
	if (type == "local") {
		MYWEB = MYWEB_1;
		MYWEBS = MYWEBS_1;
	}
	else if (type == "online") {
		MYWEB = MYWEB_2;
		MYWEBS = MYWEBS_2;
	}
	if (type == "secure") {
		MYWEB = MYWEB_3;
		MYWEBS = MYWEBS_3;
	}

	FILESURL = MYWEB + "db/files/";

	SOCKET = new WebSocket(MYWEBS);
	SOCKET.binaryType = "arraybuffer";
	SOCKET.onopen = function(event) {};
	SOCKET.onerror = function (event) {};
	SOCKET.onmessage = function (event) {
		if (event.data instanceof ArrayBuffer) {
			onCallback(event.data);
		}
		else {
			var response = JSON.parse(event.data);

			if (response.type == RESPONSE_TYPES.CONN_CLOSED ||
				response.type == RESPONSE_TYPES.USER_LOGIN ||
				response.type == RESPONSE_TYPES.USER_LOGOUT) {
				updateUserStatus(response.data);
			}
			else if (response.type == RESPONSE_TYPES.USER_UPDATED) {
				updateUserAvatar(response.data);
			}
			else if (response.type == RESPONSE_TYPES.CHAT_SENT) {
				addChat(response.data, false);
			}
			else if (response.type == RESPONSE_TYPES.CHAT_RECEIVED) {
				updateChat(response.data, false);
			}
			else if (response.type == RESPONSE_TYPES.CHAT_DELETED) {
				updateChat(response.data, true);
			}
			else if (response.type == RESPONSE_TYPES.CHAT_UPDATED) {
				updateChat(response.data, false);
			}
			else if (onCallback != null) {
				onCallback(response);
			}
		}
	};

	if (testing) {
		runTest();
	}
	else {
		updateActions();
	}
}

function runTest() {

	var count = 100;
	
	var test = function() {
		wsLogin("test", "test", function(response) {

			if (response.type == RESPONSE_TYPES.OK) {
				
				// create users
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsRegister(username, username, username + "@test.de", "*", function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "User " + res.data.name + " was created";
						}
					});
				}
				
				// add contacts
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsAddContact("Nader", username, function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "Contact was added to the user " + res.data.name;
						}		
					});	
				}
				
				// login users
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsLogin(username, username, function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "User " + res.data.name + " logged in";
						}
					});
				}
				
				// login users
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsLogin(username, username, function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "User " + res.data.name + " logged in";
						}
					});
				}
				
				// logout users
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsLogout(username, function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "User " + res.data.name + " logged out";
						}
					});
				}
				
				// delete users
				for (var i=0; i < count; i++) {
					var username = "test-" + i;
					wsDeleteUser(username, function(res) {
						if (res.type == RESPONSE_TYPES.OK) {
							document.getElementById("msgSpan").innerHTML = "User " + res.data.name + " was deleted";
						}
					});
				}
			}
		});
	}
	
	setTimeout(test, 2000);
}

function sendMessage(msg, callback) {
	onCallback = callback;
	SOCKET.send(msg instanceof ArrayBuffer ? msg : JSON.stringify(msg));
}

function wsRegister(username, password, email, avatar, callback) {
	var msg = {
		"type": REQUEST_TYPES.CreateUser,
		"name": username,
		"password": password,
		"email": email,
		"avatar": avatar ? avatar : "user.png",
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLogin(username, password, callback) {
	var msg = {
		"type": REQUEST_TYPES.Login,
		"name": username,
		"password": password
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLoginCookie(username, callback) {
	var msg = {
		"type": REQUEST_TYPES.LoginCookie,
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLogout(username, callback) {
	var msg = {
		"type": REQUEST_TYPES.Logout,
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetUser(callback) {
	var msg = {
		"type": REQUEST_TYPES.GetUser,
		"name": USERNAME
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsUpdateUser(username, email, password, avatar, callback) {
	var msg = {
		"type": REQUEST_TYPES.UpdateUser,
		"name": username,
		"password": password,
		"email": email,
		"avatar": avatar
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsDeleteUser(username, callback) {
	var msg = {
		"type": REQUEST_TYPES.DeleteUser,
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetAllUsers(callback) {
	var msg = {
		"type": REQUEST_TYPES.GetAllUsers
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetContacts(user, callback) {
	var msg = {
		"type": REQUEST_TYPES.GetContacts,
		"name": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsAddContact(user, contact, callback) {
	var msg = {
		"type": REQUEST_TYPES.AddContact,
		"name": user,
		"contact": contact
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsRemoveContact(user, contact, callback) {
	var msg = {
		"type": REQUEST_TYPES.RemoveContact,
		"name": user,
		"contact": contact
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetGroups(user, own, callback) {
	var msg = {
		"type": REQUEST_TYPES.GetGroups,
		"name": user,
		"ownGroups": own
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsCreateGroup(group, owner, callback) {
	var msg = {
		"type": REQUEST_TYPES.CreateGroup,
		"name": group,
		"avatar": group + ".png",
		"owner": owner
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsDeleteGroup(group, callback) {
	var msg = {
		"type": REQUEST_TYPES.DeleteGroup,
		"name": group
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetAllGroups(callback) {
	var msg = {
		"type": REQUEST_TYPES.GetAllGroups
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsAddToGroup(group, user, callback) {
	var msg = {
		"type": REQUEST_TYPES.AddToGroup,
		"name": group,
		"member": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsRemoveFromGroup(group, user, callback) {
	var msg = {
		"type": REQUEST_TYPES.RemoveFromGroup,
		"name": group,
		"member": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetChannel(name, callback) {
	var msg = {
		"type": REQUEST_TYPES.GetChannel,
		"name": name
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsWriteChat(user, channel, text, file, time, callback) {
	var msg = {
		"type": REQUEST_TYPES.WriteChat,
		"user": user,
		"channel": channel,
		"text": text ? text : "",
		"file": file ? file : "",
		"time": time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsReadChat(user, channel, time, pos, count, callback) {
	var msg = {
		"type": REQUEST_TYPES.ReadChat,
		"user": user,
		"channel": channel,
		"time": time,
		"pos": pos,
		"count" : count
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsDeleteChat(user, time, callback) {
	var msg = {
		"type": REQUEST_TYPES.DeleteChat,
		"user": user,
		"time" : time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsUpdateChat(user, channel, text, file, time, state, callback) {
	var msg = {
		"type": REQUEST_TYPES.UpdateChat,
		"user": user,
		"channel": channel,
		"text": text,
		"file": file,
		"time": time,
		"state": state
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsReceiveChat(user, channel, text, file, time, state, callback) {
	var msg = {
		"type": REQUEST_TYPES.ReceivedChat,
		"user": user,
		"channel": channel,
		"text": text,
		"file": file,
		"time": time,
		"state": state
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsUploadFile(file, user, isAvatar, callback) {

	var ft = getFileType(file.name);
	var name = isAvatar ? user + ft.type : ft.name; // ft.origname;
	var reader = new FileReader();

	reader.onload = function() {

		var data = this.result;

		var msg = {
			"type": REQUEST_TYPES.UploadFile,
			"user": user,
			"name": name,
			"avatar" : isAvatar
		};
		showLoading(true, msg, function(resp1) {
			if (resp1.type == RESPONSE_TYPES.OK) {
				showLoading(true, data, function(resp2) {
					callback(resp2, ft.name);
				});
			}
			else {
				callback(resp1, ft.name);
			}
		});
	};
	reader.readAsArrayBuffer(file);
}

function wsForwardChat(user, channel, time, callback) {
 
	var msg = {
		"type": REQUEST_TYPES.ForwardChat,
		"user": user,
		"channel": channel,
		"time" : time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsDownloadFile(name) {

	var saveByteArray = (function () {
		if (window.navigator && window.navigator.msSaveOrOpenBlob) {
			return function (data, name) {
				var blob = new Blob([new Uint8Array(data)], {type: "octet/stream"});
				window.navigator.msSaveOrOpenBlob(blob, name);
			};
		}
		else {
			return function (data, name) {

				var blob = new Blob(data, {type: "octet/stream"});
				var url = window.URL.createObjectURL(blob);

				var a = document.createElement("a");
				document.body.appendChild(a);
				a.style = "display: none";
				a.href = url;
				a.download = name;
				a.click();
				document.body.removeChild(a);
				setTimeout(function() { window.URL.revokeObjectURL(url); }, 1000);
			};
		}
	}());

	showLoading(true, {"type": REQUEST_TYPES.DownloadFile, "name": name}, function(response) {
		saveByteArray([response], name);
	});
}

function wsLoadImage(id, name) {
	var msg = {
		"type": REQUEST_TYPES.DownloadFile,
		"name": name
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsResetPassword(username, email, callback) {
	var msg = {
		"type": REQUEST_TYPES.ResetPassword,
		"name": username,
		"email": email,
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsReboot(username, password, callback) {
	var msg = {
		"type": REQUEST_TYPES.Reboot,
		"name": username,
		"password": password
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

//===============================
//  Utils
//===============================

function getWindowSize() {
	var w = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName('body')[0],
	x = w.innerWidth || e.offsetWidth || g.offsetWidth,
	y = w.innerHeight || e.offsetHeight || g.offsetHeight;
	return { width: x, height: y };
}

function resizeImage(width, height, destWidth, destHeight) {
	var ratioW = width / destWidth;
	var ratioH = height / destHeight;
	if (ratioW <= 1 && ratioH <= 1)
	{
		var ratio = 1 / ((ratioW > ratioH) ? ratioW : ratioH);
		width *= ratio;
		height *= ratio;
	}
	else if (ratioW > 1 && ratioH <= 1)
	{
		var ratio = 1 / ratioW;
		width *= ratio;
		height *= ratio;
	}
	else if (ratioW <= 1 && ratioH > 1)
	{
		var ratio = 1 / ratioH;
		width *= ratio;
		height *= ratio;
	}
	else if (ratioW >= 1 && ratioH >= 1)
	{
		var ratio = 1 / ((ratioW > ratioH) ? ratioW : ratioH);
		width *= ratio;
		height *= ratio;
	}
	return {width : width, height : height};
}

function getFileType(filename) {
	var nm = filename.toLowerCase();
	var tp = nm.lastIndexOf(".");
	if (tp != -1) tp = nm.substring(tp, nm.length);
	else tp = "";

	var im = (tp == ".jpg" || tp == ".jpeg" || tp == ".png" || tp == ".gif");
	var iv = (tp == ".mp4");
	var ia = (tp == ".mp3");

	return {
		name: im ? ("famchat" + timestamp() + tp) : filename,
		origname: filename,
		type: tp,
		isimage: im,
		isvideo: iv,
		isaudio: ia
	};
}

function timestamp() {
	return Math.floor((new Date).getTime());
}

function tsToDateTime(ts) {
	var dt = new Date(parseInt(ts));
	var yy = dt.getFullYear();
	var mm = dt.getMonth() + 1;
	var dd = dt.getDate();
	var hr = dt.getHours();
	var m = "0" + dt.getMinutes();
	var s = "0" + dt.getSeconds();
	//return dd + '/' + mm + '/' + yy + ' - ' + hr + ':' + m.substr(-2) + ':' + s.substr(-2);
	return dd + '/' + mm + '/' + yy + ' - ' + hr + ':' + m.substr(-2);
}

function stopPropagation(e) {
	e = e || window.event;
	if (e.cancelBubble != null) e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
	if (e.stopImmediatePropagation) e.stopImmediatePropagation();
	e.preventDefault();
}

function isActiveElement(elem) {
	var ae = document.activeElement;
	while (ae) {
		if (ae == elem) return true;
		ae = ae.parentNode;
	}
	return false;
}

//======= APP ========

function updateActions(username, usavatar, channel, chavatar, logout) {

	// Only call at firsttime
	if (username == null && !logout) {
		document.addEventListener("keydown", function(ev) {
			if (ev.keyCode == 13) {
				var pas = document.getElementById("password");
				if (isActiveElement(pas)) {
					stopPropagation(ev);
					var bt = document.getElementById("defaultActionButton");
					bt.click();
				}
			}
		});
	}

	UPDATING = false;
	UPLOADING = false;

	USERNAME = username;
	USAVATAR = usavatar;
	CHANNEL = channel;
	CHAVATAR = chavatar;

	var cookieLogin = USERNAME == null;
	var localStorage = window.localStorage;
	var sessionStorage = window.sessionStorage;

	if (typeof(localStorage) !== "undefined") {
		if (USERNAME) {
			localStorage.setItem("USERNAME", USERNAME);
			localStorage.setItem("USAVATAR", USAVATAR);
			if (CHANNEL) {
				localStorage.setItem("CHANNEL", CHANNEL);
				if (CHAVATAR) {
					localStorage.setItem("CHAVATAR", CHAVATAR);
				}
				else if (logout) localStorage.removeItem("CHAVATAR");
			}
			else if (logout) localStorage.removeItem("CHANNEL");
		}
		else if (logout) localStorage.clear();

		USERNAME = localStorage.getItem("USERNAME");
		USAVATAR = localStorage.getItem("USAVATAR");
		CHANNEL = localStorage.getItem("CHANNEL");
		CHAVATAR = localStorage.getItem("CHAVATAR");
	}
	else if (typeof(sessionStorage) !== "undefined") {
		if (USERNAME) {
			sessionStorage.setItem("USERNAME", USERNAME);
			localStorage.setItem("USAVATAR", USAVATAR);
			if (CHANNEL) {
				sessionStorage.setItem("CHANNEL", CHANNEL);
				if (CHAVATAR) {
					sessionStorage.setItem("CHAVATAR", CHAVATAR);
				}
				else if (logout) sessionStorage.removeItem("CHAVATAR");
			}
			else if (logout) sessionStorage.removeItem("CHANNEL");
		}
		else if (logout) sessionStorage.clear();

		USERNAME = sessionStorage.getItem("USERNAME");
		USAVATAR = localStorage.getItem("USAVATAR");
		CHANNEL = sessionStorage.getItem("CHANNEL");
		CHAVATAR = sessionStorage.getItem("CHAVATAR");
	}

	var hd = "<table border=0 cellpadding=6 cellspacing=0 width=100% height=100%><tr>" +
		"<td><span class='title h2'>FAMCHAT</span></td>" +
		"<td style='width:100%'></td>" + (USERNAME ?
		"<td><img id='userAvatar' src='" + FILESURL + "avatar/" + USAVATAR + "'></td>" +
		"<td style='padding:0 0 5px 0'><span id='usernameSp'>" + USERNAME + "</span></td>" +
		"<td><label id='settingBt' onclick='openSetting()'/></td>" +
		"<td><label id='logoutBt' onclick='logout()'/></td>" : "") +
		"<td><label id='refreshBt' onclick='refresh()'/></td>" +
		"<td style='width:10px'></td></tr></table>";

	var fd = "<table border=0 cellpadding=0 cellspacing=0 width=100% height=100%><tr>" +
		"<td><img id='loading' src='res/img/loading.gif' alt='Loading...'/></td>" +
		"<td style='text-align:right'><span id='copyright'>Copyright © 2018 nalizadeh.org</span></td></tr></table>";
		
	var ci = "<table border=0 cellpadding=3 cellspacing=0 width=100% height=100%><tr>" + 
		(USERNAME ? "<td><label id='channelsBt' class='channelsOnBt' onclick='openChannels()'></label></td>" : "") + 
		(CHANNEL ? "<td style='white-space:nowrap;'>Chat with</td><td><img class='channelAv' id='chAvImg" + CHANNEL + "' src='" +
		FILESURL + "avatar/" + CHAVATAR + "'></td><td>" + CHANNEL + "</td>" :
		USERNAME ? "<td><span style='white-space: nowrap;'>Select a channel to write</span></td>" : "") +
		"<td style='width:99%'></td>" +
		"<td><img id='loadChatsBt' src='res/img/reload.png' onclick='loadChats()'></td>" +
		"<td><img id='closeChannelBt' src='res/img/close.png' onclick='closeChannel()'/></td></tr></table>";

	var cc = USERNAME ?
		"<table border=0 cellpadding=5 cellspacing=0 width=100% height=100%><tr>" +
		"<td><label id='channelsBt2' class='channelsOnBt' onclick='openChannels()'></label></td>" +
		"<td><label id='attachBt'><input type='file' accept='image/*' onchange='sendFile(event)'></label></td>" +
		"<td><label id='smileBt' onclick='showSmiley()'></label></td>" +
		"<td style='width:100%'><span id='chatText' contenteditable='true'></span></td>" +
		"<td><label id='sendBt' onclick='sendText()'></label></td>" +
		"</tr></table>" : "";

	document.getElementById("header").innerHTML = hd;
	document.getElementById("footer").innerHTML = fd;
	
	document.getElementById("channelInfo").innerHTML = ci;
	document.getElementById("loadChatsBt").style.display = CHANNEL && CHATPOS > 0 ? "inline-block" : "none";
	document.getElementById("closeChannelBt").style.display = CHANNEL ? "inline-block" : "none";

	document.getElementById("controls").style.visibility = USERNAME ? "visible" : "hidden";
	document.getElementById("controls").innerHTML = cc;

	if (USERNAME) {
		document.getElementById("attachBt").style.pointerEvents = CHANNEL ? "auto" : "none";
		document.getElementById("attachBt").style.opacity = CHANNEL ? 1 : 0.3;
		document.getElementById("smileBt").style.pointerEvents = CHANNEL ? "auto" : "none";
		document.getElementById("smileBt").style.opacity = CHANNEL ? 1 : 0.3;
		document.getElementById("sendBt").style.pointerEvents = CHANNEL ? "auto" : "none";
		document.getElementById("sendBt").style.opacity = CHANNEL ? 1 : 0.3;
		document.getElementById("chatText").style.opacity = CHANNEL ? 1 : 0.3;
	}

	document.getElementById("login_div").style.display = USERNAME ? "none" : "inline";
	document.getElementById("login_signup_box").style.display = USERNAME ? "none" : "inline";
	document.getElementById("chatArea").innerHTML = "";

	clearChatArea();

	if (cookieLogin && USERNAME != null) {
		setTimeout(function() {
			wsLoginCookie(USERNAME, function(response) {
				//alert(response.message);

				if (response.type == RESPONSE_TYPES.OK && CHANNEL) {
					makeSmiley();
					startChat();
				}
			});
		}, 2000);
	}
	else if (USERNAME && CHANNEL) {
		makeSmiley();
		startChat();
	}
}

//======= LOGIN / SIGNUP ========

function register() {

	var username = document.getElementById("username2").value;
	var password = document.getElementById("password2").value;
	var email = document.getElementById("email").value;
	var password2 = document.getElementById("password3").value;

	if (username.length == 0) { alert("Wrong username!"); return; }
	if (email.length == 0) { alert("Wrong email!"); return; }
	if (password.length == 0) { alert("Wrong password!"); return; }
	if (password !== password2) { alert("Wrong password!"); return; }

	wsRegister(username, password, email, null, function(response) {
		alert(response.message);
		endRegistration();
	});
}

function updateUser() {
	var username = document.getElementById("n_username").value;
	var email = document.getElementById("n_emai").value;
	var password = document.getElementById("n_password").value;
	var password2 = document.getElementById("n_password2").value;
	var avatar = document.getElementById("n_avatar").value;

	if (username.length == 0) { alert("Wrong username!"); return; }
	if (email.length == 0) { alert("Wrong email!"); return; }
	if (password.length == 0) { alert("Wrong password!"); return; }
	if (password !== password2) { alert("Wrong password!"); return; }

	if (USAVATAR != null) {

		if (USAVATAR.name) {
			avatar = USERNAME + getFileType(USAVATAR.name).type;

			var windowURL = window.URL || window.webkitURL;
			var picURL = windowURL.createObjectURL(USAVATAR);
			var img = new Image();

			img.onload = function() {
				wsUploadFile(USAVATAR, USERNAME, true, function(response, name) {
					if (response.type == RESPONSE_TYPES.OK) {
						windowURL.revokeObjectURL(picURL);
						wsUpdateUser(username, email, password, avatar, function(response) {
							alert(response.message);
							endUserSetting();
						});
					}
					else {
						alert(response.message);
					}
				});
			};
			img.src = picURL;
		}
		else {
			wsUpdateUser(username, email, password, USAVATAR, function(response) {
				alert(response.message);
				endUserSetting();
			});
		}
	}
	else endUserSetting();
}

function deleteUser() {
	var username = document.getElementById("n_username").value;
	var r = confirm("Delete the user " + username + "?");
	if (r == true) {
		wsDeleteUser(username, function(response) {
			alert(response.message);
		});
	}
}

function login() {
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	if (username.length == 0) { alert("Wrong username!"); return; }
	if (password.length == 0) { alert("Wrong password!"); return; }
	wsLogin(username, password, function(response) {
		if (response.type !== RESPONSE_TYPES.OK) {
			alert(response.message);
		}
		else {
			endLogin(true);
			updateActions(username, response.data.avatar);
		}
	});
}

function logout() {
			
	if (UPDATING || UPLOADING) return;

	wsLogout(USERNAME, function(response) {
		if (response.type !== RESPONSE_TYPES.OK) {
			alert(response.message);
		}
		else {
			closeChannels();
			closeSetting();
			hideSmiley();
			updateActions(null, null, null, null, true);
		}
	});
}

function startLogin() {
	document.getElementById("login_signup_box").style.display = "none";
	document.getElementById("login_box").style.display = "inline";
	document.getElementById("password").value = "";
}

function startRegistration() {
	document.getElementById("login_signup_box").style.display = "none";
	document.getElementById("signup_box").style.display = "inline";
	document.getElementById("password2").value = "";
	document.getElementById("password3").value = "";
}

function startSendEmail() {
	document.getElementById("login_box").style.display = "none";
	document.getElementById("sendmail_box").style.display = "inline";
}

function endLogin(logged) {
	document.getElementById("login_box").style.display = "none";
	document.getElementById("login_signup_box").style.display = logged ? "none" : "inline";
}

function endRegistration() {
	document.getElementById("signup_box").style.display = "none";
	document.getElementById("login_signup_box").style.display = "inline";
}

function endSendEmail() {
	document.getElementById("sendmail_box").style.display = "none";
	document.getElementById("login_box").style.display = "inline";
}

function resetPassword() {
	var us = document.getElementById("usernameX").value;
	var em = document.getElementById("emailX").value;
	if (us != "" && em != "") {
		wsResetPassword(us, em, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				alert(response.message);
				closeChannels();
				closeSetting();
				hideSmiley();
				updateActions(null, null, null, null, true);
			}
			else {
				alert(response.message);
			}
		});
	}
}

function refresh() {
	location.reload();
}

//======= SETTINGS ========

function openSetting() {
	var sd = document.getElementById("setting_div");
	if (sd.style.display != "inline") {
		hideSmiley();
		closeChannels();
		var ca = document.getElementById("chatArea");
		var co = document.getElementById("controls");

		ca.style.opacity = 0.2;
		co.style.opacity = 0.2;
		sd.style.display = "inline";
		startSetting();
	}
}

function closeSetting() {
	endSetting();
	document.getElementById("setting_div").style.display = "none";
	document.getElementById("chatArea").style.opacity = 1;
	document.getElementById("controls").style.opacity = 1;
}

function startSetting() {
	document.getElementById("setting_box").style.display = "inline";
}

function endSetting() {
	document.getElementById("user_box").style.display = "none";
	document.getElementById("contacts_box").style.display = "none";
	document.getElementById("groups_box").style.display = "none";
	document.getElementById("admin_box").style.display = "none";
	document.getElementById("adminlogin_box").style.display = "none";
	document.getElementById("setting_box").style.display = "none";
}

function getData(callback) {
	wsGetContacts(USERNAME, function(r1) {
		wsGetGroups(USERNAME, true, function(r2) {
			wsGetAllUsers(function(r3) {
				makeContactList(r1.data);
				makeGroupsList(r2.data);
				makeUserList(r3.data);
				makeMemberList();
				callback();
			});
		});
	});
}

//======= USER SETTINGS ========

function startUserSetting() {
	wsGetUser(function(response) {
		document.getElementById("setting_box").style.display = "none";
		document.getElementById("user_box").style.display = "inline";
		document.getElementById("n_username").value = response.data.name;
		document.getElementById("n_emai").value = response.data.email;
		document.getElementById("n_password").value = "";
		document.getElementById("n_password2").value = "";
		document.getElementById("n_avatar").value = response.data.avatar;
	});
}

function endUserSetting() {
	CHAVATAR = null;
	document.getElementById("user_box").style.display = "none";
	document.getElementById("setting_box").style.display = "inline";
}

//======= CONTACTS SETTINGS ========

function startContactsSetting() {
	getData(function() {
		document.getElementById("setting_box").style.display = "none";
		document.getElementById("contacts_box").style.display = "inline";
	});
}

function endContactsSetting() {
	document.getElementById("contacts_box").style.display = "none";
	document.getElementById("setting_box").style.display = "inline";
}

function makeContactList(contacts) {
	var opt = "<option value='none'>none</option>";
	if (contacts.length > 0) {
		opt = "";
		for (var i=0; i < contacts.length; i++) {
			opt += "<option value='" + contacts[i].name + "'>" + contacts[i].name + "</option>";
		}
	}
	document.getElementById("contacts").innerHTML = opt;
}

function makeUserList(users) {
	var opt = "<option value='none'>none</option>";
	if (users.length > 0) {
		opt = "";
		for (var i=0; i < users.length; i++) {
			opt += "<option value='" + users[i].name + "'>" + users[i].name + "</option>";
		}
	}
	document.getElementById("u_users").innerHTML = opt;
	document.getElementById("g_users").innerHTML = opt;
}

function addContact() {
	var sel = document.getElementById("u_users");
	var con = sel.options[sel.selectedIndex].value;
	if (con != "none" && con != USERNAME) {
		wsAddContact(USERNAME, con, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
				});
			}
			else alert(response.message);
		});
	}
}

function removeContact() {
	var sel = document.getElementById("contacts");
	var con = sel.options[sel.selectedIndex].value;
	if (con != "none") {
		wsRemoveContact(USERNAME, con, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
					if (CHANNEL == con) closeChannel();
				});
			}
			else alert(response.message);
		});
	}
}

//======= GROUPS SETTINGS ========

function startGroupsSetting() {
	getData(function() {
		document.getElementById("setting_box").style.display = "none";
		document.getElementById("groups_box").style.display = "inline";
	});
}

function endGroupsSetting() {
	document.getElementById("groups_box").style.display = "none";
	document.getElementById("setting_box").style.display = "inline";
}

function makeGroupsList(groups) {
	GROUPS = groups;
	var opt = "<option value='none'>none</option>";
	if (groups.length > 0) {
		opt = "";
		for (var i=0; i < groups.length; i++) {
			opt += "<option value='" + groups[i].name + "'>" + groups[i].name + "</option>";
		}
	}
	var select = document.getElementById("groups");
	select.innerHTML = opt;
	select.addEventListener("change", makeMemberList);
}

function makeMemberList() {
	var sel = document.getElementById("groups");
	var grp = sel.options[sel.selectedIndex].value;
	var opt = "<option value='none'>none</option>";
	if (grp != "none" && GROUPS[sel.selectedIndex].members != "") {
		var group = GROUPS[sel.selectedIndex];
		if (group.members.length > 0) {
			opt = "";
			for (var i=0; i < group.members.length; i++) {
				opt += "<option value='" + group.members[i] + "'>" + group.members[i] + "</option>";
			}
		}
	}
	document.getElementById("members").innerHTML = opt;
}

function addToGroup() {
	var sel1 = document.getElementById("g_users");
	var sel2 = document.getElementById("groups");
	var usr = sel1.options[sel1.selectedIndex].value;
	var grp = sel2.options[sel2.selectedIndex].value;
	if (grp != "none" && usr != "none" && usr != USERNAME) {
		wsAddToGroup(grp, usr, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
					if (CHANNEL == con) closeChannel();
				});
			}
			else alert(response.message);
		});
	}
}

function removeFromGroup() {
	var sel1 = document.getElementById("members");
	var sel2 = document.getElementById("groups");
	var usr = sel1.options[sel1.selectedIndex].value;
	var grp = sel2.options[sel2.selectedIndex].value;
	if (grp != "none" && usr != "none" && usr != USERNAME) {
		wsRemoveFromGroup(grp, usr, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
				});
			}
			else alert(response.message);
		});
	}
}

function createGroup() {
	var grp = document.getElementById("groupname").value;
	if (grp != "") {
		wsCreateGroup(grp, USERNAME, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
				});
			}
			else alert(response.message);
		});
	}
}

function deleteGroup() {
	var sel = document.getElementById("groups");
	var grp = sel.options[sel.selectedIndex].value;
	if (grp != "none") {
		wsDeleteGroup(grp, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				getData(function() {
					alert(response.message);
					if (CHANNEL == grp) closeChannel();
				});
			}
			else alert(response.message);
		});
	}
}

//======= ADMIN SETTINGS ========

function startAdminSetting() {
	document.getElementById("setting_box").style.display = "none";
	document.getElementById("admin_box").style.display = "inline";
}

function endAdminSetting() {
	document.getElementById("admin_box").style.display = "none";
	document.getElementById("setting_box").style.display = "inline";
}

function startAdminLogin() {
	document.getElementById("admin_box").style.display = "none";
	document.getElementById("adminlogin_box").style.display = "inline";
	document.getElementById("xpassword").value = "";
}


function endAdminLogin() {
	document.getElementById("adminlogin_box").style.display = "none";
	document.getElementById("admin_box").style.display = "inline";
}

function reboot() {
	var username = document.getElementById("xusername").value;
	var password = document.getElementById("xpassword").value;
	if (username.length == 0) { alert("Wrong username!"); return; }
	if (password.length == 0) { alert("Wrong password!"); return; }

	var rc = confirm("Are you sure you want to reboot the server?");
	if (rc == true) {
		wsReboot(username, password, function(response) {
			endAdminLogin();
			if (response.type !== RESPONSE_TYPES.OK) {
				alert(response.message);
			}
		});
	}
}

function clearCookies() {
	if (typeof(localStorage) !== "undefined") {
		localStorage.removeItem("USERNAME", USERNAME);
		localStorage.removeItem("USAVATAR", USAVATAR);
		localStorage.removeItem("CHANNEL", CHANNEL);
		localStorage.removeItem("CHAVATAR", CHAVATAR);
	}
	else if (typeof(sessionStorage) !== "undefined") {
		sessionStorage.removeItem("USERNAME", USERNAME);
		sessionStorage.removeItem("USAVATAR", USAVATAR);
		sessionStorage.removeItem("CHANNEL", CHANNEL);
		sessionStorage.removeItem("CHAVATAR", CHAVATAR);
	}
	refresh();
}

//======= CHANNELS ========

function makeChannelList(data) {

	var bf = [];
	
	bf.push("<table border=0 cellpadding=5 cellspacing=0 width=100% height=100%><tr>");
	bf.push("<td><input id='searchInp' type='text' placeholder='Search..'></td>");
	bf.push("<td><img id='searchBt' src='res/img/search.png' onclick='findChannel();'/></td>");
	bf.push("</tr></table>");

	document.getElementById("channelSearch").innerHTML = bf.join("");

	bf = [];
	
	bf.push("<ul>");
	for (var i=0; i < data.length; i++) {
		var d = data[i];
		var av = d.avatar === "*" ? (d.isUser ? "user.png" : "group.png") : d.avatar;

		var st = d.isUser ? ("<img src='" + MYWEB + (d.status == "1" ? "res/img/online.png" : "res/img/offline.png") + "'>&ensp;" +
		(d.status == "1" ? "online" : "offline")) : "";

		bf.push("<li onclick=\"openChannel('" + d.name + "','" + av + "')\">");
		bf.push("<table border=0 cellpadding=0 cellspacing=0>");
		bf.push("<tr><td class='avaImgTd'><img id='avaImg" + d.name + "' src='" + FILESURL + "avatar/" + av + "' width='48px' height='48px'></td><td><h3>" + d.name + "</h3></td></tr>");
		bf.push("<tr><td colspan=2><span class='lisp1' id='stx" + d.name + "'>" + st + "</span></td></tr>");
		bf.push("<tr><td colspan=2><span class='lisp2' id='tmx" + d.name + "'>" + tsToDateTime(d.time) + "</span></td></tr></table></li>");
	}
	bf.push("</ul>");
	document.getElementById("channelsArea").innerHTML = bf.join("");
}

function getChannels() {
	if (USERNAME != null) {

		wsGetContacts(USERNAME, function(response1) {
			wsGetGroups(USERNAME, false, function(response2) {
				var data = [];
				for (var i=0; i < response1.data.length; i++) {
					var u = response1.data[i];
					data.push({name:u.name, email:u.email, avatar:u.avatar, time:u.time, status:u.status, isUser:true});
				}
				for (var i=0; i < response2.data.length; i++) {
					var g = response2.data[i];
					data.push({name:g.name, email:"", avatar:g.avatar, time:g.time, isUser:false});
				}

				makeChannelList(data);
			});
		});
	}
}

function openChannels() {
	closeSetting();
	hideSmiley();

	var ca = document.getElementById("channels");
	var ci = document.getElementById("channelsArea");

	if (ca.clientWidth == 0) {
		if (ca.getAttribute("layout")) {
			ca.setAttribute("layout", "width:160px;height:100%;");
			initLayout();
		}
		else {
			ca.style.display = "block";
			ca.style.width = "160px";
		}
		ci.innerHTML = "<div style='width:100%; text-align:center; padding-top:20px;'><img src='" + MYWEB + "res/img/loading2.gif'/></div>";
		getChannels();
		var cb = document.getElementById("channelsBt");
		cb.classList.remove("channelsOnBt");
		cb.classList.add("channelsOffBt");
		
		cb = document.getElementById("channelsBt2");
		cb.classList.remove("channelsOnBt");
		cb.classList.add("channelsOffBt");
	}
	else closeChannels();
}

function closeChannels() {

	hideSmiley();
	var ca = document.getElementById("channels");
	if (ca.getAttribute("layout")) {
		ca.setAttribute("layout", "width:0px;height:100%;");
		initLayout();
	} 
	else {
		ca.style.display = "none";
		ca.style.width = "0px";
	}
	var cb = document.getElementById("channelsBt");
	cb.classList.remove("channelsOffBt");
	cb.classList.add("channelsOnBt");

	cb = document.getElementById("channelsBt2");
	cb.classList.remove("channelsOffBt");
	cb.classList.add("channelsOnBt");
}

function openChannel(channel, avatar) {
	hideSmiley();
	if (!UPDATING && USERNAME != channel && CHANNEL != channel) {
		updateActions(USERNAME, USAVATAR, channel, avatar);
		
		var ca = document.getElementById("channels");
		if (ca.clientWidth != 0) {
			var cb = document.getElementById("channelsBt");
			cb.classList.remove("channelsOnBt");
			cb.classList.add("channelsOffBt");
			cb = document.getElementById("channelsBt2");
			cb.classList.remove("channelsOnBt");
			cb.classList.add("channelsOffBt");
		}
	}
}

function closeChannel() {
	if (!UPDATING && !UPLOADING) {
		updateActions(USERNAME, USAVATAR, null, null, true);

		var ca = document.getElementById("channels");
		if (ca.clientWidth != 0) {
			var cb = document.getElementById("channelsBt");
			cb.classList.remove("channelsOnBt");
			cb.classList.add("channelsOffBt");
			cb = document.getElementById("channelsBt2");
			cb.classList.remove("channelsOnBt");
			cb.classList.add("channelsOffBt");
		}
	}
}

function findChannel() {
	var name = document.getElementById("searchInp").value;
	if (name == "" && SEARCHCHANNEL != "") {
		SEARCHCHANNEL = "";
		getChannels();
	}
	else if (name != "") {
		SEARCHCHANNEL = name;
		wsGetChannel(name, function(response) {
			if (response.type == RESPONSE_TYPES.OK) {
				var data = [];
				var u = response.data;
				data.push({name:u.name, email:u.email, avatar:u.avatar, time:u.time, status:u.status, isUser:u.isUser == "true"});
				makeChannelList(data);
			}
			else alert(response.message);
		});
	}
}

function updateUserAvatar(user) {
	var ui = document.getElementById("avaImg" + user.name);
	if (ui) ui.src = FILESURL + "avatar/" + user.avatar;

	ui = document.getElementById("userAvatar");
	if (ui) ui.src = FILESURL + "avatar/" + user.avatar;

	ui = document.getElementById("chAvImg" + user.name);
	if (ui) ui.src = FILESURL + "avatar/" + user.avatar;
}

//======= CHAT ========

function addCSSRule(sheet, selector, rules, index) {
	try {
		if ("insertRule" in sheet) sheet.insertRule(selector + "{" + rules + "}", index);
		else if ("addRule" in sheet) sheet.addRule(selector, rules, index);
	} catch(err) {
		try { if ("addRule" in sheet) sheet.addRule(selector, rules, index); } catch(err) {}
	}
}

function clearChatArea() {
	var ca = document.getElementById("chatArea");
	ca.innerHTML = "<table id='chatAreaTable' border=0, cellpadding=0, cellspacing=0 width='100%'></table>";
}

function download(nm) {
	if (typeof app !== "undefined") {
		var fn = nm.split("\\").pop().split("/").pop();
		app.saveImage(FILESURL + "chats/" + nm, fn);
	}
	else {
		wsDownloadFile(nm);
	}
}

function forwardChat(tm) {
	var channel = prompt("Please enter channel", "");
	if (channel != null && channel != "") {
		wsForwardChat(USERNAME, channel, tm, function(response) {
		});
	}
}

function createTextDiv(user, txt, file, tm, ck, upload, update, del, callback) {

	if (del) {
		document.getElementById("fc_tx_" + tm).innerHTML = "";
		return;
	}
	
	var bt = user == USERNAME ?
		"<td><img class='chatBt' src='" + MYWEB + "res/img/delete.png' onclick=\"deleteChat('" + tm + "')\"></td>" +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/edit.png' onclick=\"editChat('" + tm + "')\"></td>" +
		(file ? "<td><img class='chatBt' src='" + MYWEB + "res/img/download.png' onclick=\"download('" + file + "')\"></td>" : "") +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/forward.png' onclick=\"forwardChat('" + tm + "')\">" :

		(file ? "<td><img class='chatBt' src='" + MYWEB + "res/img/download.png' onclick=\"download('" + file + "')\"></td>" : "") +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/forward.png' onclick=\"forwardChat('" + tm + "')\">";

	var ch = user == USERNAME ? "<td><img src='" + MYWEB + "res/img/" + (ck == "1" ? "check.png" : "check2.png") + "' id='ck" + tm + "'></td>" : "";
	
	var a1 = "<td class='chatTdAv'><img class='chavatar' src='" + FILESURL + "avatar/" + (user == USERNAME ? USAVATAR : CHAVATAR) + "'></td>";
	var a2 = "<td class='chatTdBu'><img src='" + MYWEB + "res/img/" + (user == USERNAME ? "bubto" : "bubfrom") + ".png'></td>";
	var a3 = "<td class='chatTdTx'><div class='" + (user == USERNAME ? "chatDivTo" : "chatDivFrom") + "'>" +
		"<table border=0 cellpadding=2 cellspacing=0 width=100%><tr><td style='width:99%'><span class='chatInfUs'>" + user + "</span>&ensp;" +
		"<span class='chatInfTm'>" + tsToDateTime(tm) + "</span></td><td style='width:20px'></td>" + bt + ch + "</tr></table>" + 
		(txt ? "<br>" + txt : "") + "</div></td>";
		
	var ih = "<div style='display:inline-block'><table border=0 cellpadding=0 cellspacing=0><tr>" +
		(user == USERNAME ? a1 + a2 + a3 : a3 + a2 + a1) + "</tr></table></div>";

	if (update) {
		document.getElementById("fc_tx_" + tm).innerHTML = ih;
		return;
	}

	var ta = document.getElementById("chatAreaTable");
	var tr = document.createElement("tr");
	var td = document.createElement("td");

	td.className = user == USERNAME ? "chatTdTo" : "chatTdFrom";
	td.id = "fc_tx_" + tm;
	td.innerHTML = ih;

	tr.appendChild(td);
	ta.appendChild(tr);

	td.scrollIntoView();

	if (upload) {
		UPLOADING = true;
		wsWriteChat(USERNAME, CHANNEL, txt, "", tm, function() {
			CHATTIME = timestamp();
			UPLOADING = false;
			if (callback) callback();
		});
	}
	else if (callback) callback();
}

function createImageDiv(user, txt, file, fname, tm, ck, upd, del, callback) {

	if (del) {
		createTextDiv(user, txt, fname, tm, ck, false, false, true);
		document.getElementById("fc_imdv_" + tm).innerHTML = "";
		if (callback) callback();
		return;
	}
	if (upd) {
		createTextDiv(user, txt, fname, tm, ck, false, true, false);
		var img = document.getElementById("fc_im_" + tm);
		img.updating = true;
		img.src = FILESURL + "chats/" + fname;
		if (callback) callback();
		return;
	}

	var ta = document.getElementById("chatAreaTable");
	var tr = document.createElement("tr");
	var td = document.createElement("td");
	var uri = window.URL || window.webkitURL;
	var pic = file ? uri.createObjectURL(file) : FILESURL + "chats/" + fname;
	var div = document.createElement("div");
	var img = document.createElement("img");

	div.id = "fc_imdv_" + tm;
	div.className = user == USERNAME ? "chatImgTo" : "chatImgFrom";
	td.className = user == USERNAME ? "chatTdTo" : "chatTdFrom";
	img.id = "fc_im_" + tm;
	img.className = "chatImage";
	img.updating = false;

	img.onload = function() {

		var ws = getWindowSize();
		var dim = resizeImage(img.naturalWidth, img.naturalHeight, ws.width / 2.5, 300);
		img.width = dim.width;
		img.height = dim.height;
		img.style.margin = "10px";
		img.style.cursor = "pointer";

		img.onclick = function(e) {
			if (img.width < img.naturalWidth) {
				img.width = img.naturalWidth;
				img.height = img.naturalHeight;
			}
			else {
				img.width = dim.width;
				img.height = dim.height;
			}
		};

		if (img.updating) return;

		div.appendChild(img);
		div.scrollIntoView();

		if (file) {
			UPLOADING = true;
			setTimeout(function() {
				wsUploadFile(file, USERNAME, false, function(response, fname) {
					wsWriteChat(USERNAME, CHANNEL, txt, fname, tm, function() {
						uri.revokeObjectURL(pic);
						CHATTIME = timestamp();
						UPLOADING = false;
						if (callback) callback();
					});
				});
			}, 1000);
		}
		else if (callback) callback();
	};

	img.onerror = function() {
		if (callback) callback();
	};

	img.src = pic;

	createTextDiv(user, txt, fname, tm, ck, false, false, false);

	td.appendChild(div);
	tr.appendChild(td);
	ta.appendChild(tr);
}

function createVideoDiv(user, txt, file, fname, tm, ck, upd, del, callback) {
	if (del) {
		createTextDiv(user, txt, fname, tm, ck, false, false, true);
		document.getElementById("fc_vidv_" + tm).innerHTML = "";
		if (callback) callback();
		return;
	}
	if (upd) {
		createTextDiv(user, txt, fname, tm, ck, false, true, false);
		var vid = document.getElementById("fc_vi_" + tm);
		vid.updating = true;
		vid.src = FILESURL + "chats/" + fname;
		if (callback) callback();
		return;
	}

	var ta = document.getElementById("chatAreaTable");
	var tr = document.createElement("tr");
	var td = document.createElement("td");
	var div = document.createElement("div");
	var vid = document.createElement("video");

	div.id = "fc_vidv_" + tm;
	div.className = user == USERNAME ? "chatimgTo" : "chatimgFrom";
	td.className = user == USERNAME ? "chattdTo" : "chattdFrom";

	vid.id = "fc_vi_" + tm;
	vid.className = "chatVideo";
	vid.src = FILESURL + "chats/" + fname;
	vid.poster = fname;
	vid.controls = false;
	vid.autoPlay = true;
	vid.preload = true;
	vid.loop = true;
	vid.updating = false;

	vid.onloadeddata = function() {

		var ws = getWindowSize();
		var dim = resizeImage(vid.videoWidth, vid.videoHeight, ws.width / 2.5, 300);
		vid.width = dim.width;
		vid.style.margin = "10px";
		vid.style.cursor = "pointer";

		if (!vid.updating) {
			div.appendChild(vid);
			div.scrollIntoView();
		}
	};

	vid.onclick = function(e) {
		if (vid.paused) vid.play(); else vid.pause();
	};

	vid.onerror = function() {
		if (callback) callback();
	};

	createTextDiv(user, txt, fname, tm, ck, false, false, false);

	td.appendChild(div);
	tr.appendChild(td);
	ta.appendChild(tr);

	if (file) {
		UPLOADING = true;
		setTimeout(function() {
			wsUploadFile(file, USERNAME, false, function(response, fname) {
				wsWriteChat(USERNAME, CHANNEL, txt, fname, tm, function() {
					CHATTIME = timestamp();
					UPLOADING = false;
					vid.load();
					vid.pause();
					if (callback) callback();
				});
			});
		}, 1000);
	}
	else {
		vid.load();
		vid.pause();
		if (callback) callback();
	}
}

function createAudioDiv(user, txt, file, fname, tm, ck, upd, del, callback) {
}

function createFileDiv(user, txt, file, fname, tm, ck, upd, del, callback) {

	var tx = (txt ? txt + "<br>" : "") + "<img src='" + MYWEB + "res/img/attachment.png'> " + fname;
	
	if (del) {
		createTextDiv(user, tx, fname, tm, ck, false, false, true);
		if (callback) callback();
		return;
	}
	if (upd) {
		createTextDiv(user, tx, fname, tm, ck, false, true, false);
		if (callback) callback();
		return;
	}

	createTextDiv(user, tx, fname, tm, ck, false, false, false);

	if (file) {
		UPLOADING = true;
		setTimeout(function() {
			wsUploadFile(file, USERNAME, false, function(response, fname) {
				wsWriteChat(USERNAME, CHANNEL, txt, fname, tm, function() {
					CHATTIME = timestamp();
					UPLOADING = false;
					if (callback) callback();
				});
			});
		}, 1000);
	}
	else if (callback) callback();
}

function createDiv(user, txt, file, fname, tm, ck, update, del, callback) {

	var ft = getFileType(fname);

	if (ft.isimage) {
		createImageDiv(user, txt, file, fname, tm, ck, update, del, callback);
	}
	else if (ft.isvideo) {
		createVideoDiv(user, txt, file, fname, tm, ck, update, del, callback);
	}
	else if (ft.isaudio) {
		createAudioDiv(user, txt, file, fname, tm, ck, update, del, callback);
	}
	else {
		createFileDiv(user, txt, file, fname, tm, ck, update, del, callback);
	}
}

//==========================

function startChat() {

	stopChat();

	var doRead = function() {

		if (USERNAME == null || CHANNEL == null) {
			stopChat();
		}
		else if (UPDATING || UPLOADING) {
			UPDATELOOP = setTimeout(doRead, 2000);
		}
		else {
			readChats();
		}
	};

	doRead();
}

function stopChat() {
	if (UPDATELOOP) clearTimeout(UPDATELOOP);
	UPDATING = false;
	UPLOADING = false;
	UPDATELOOP = false;
	CHATTIME = 0;
	CHATPOS = 0;
	CHATS = [];
	clearChatArea();
}

function readChats() {
	UPDATING = true;
	wsReadChat(USERNAME, CHANNEL, CHATTIME, CHATPOS, CHATMAX, function(response) {
		if (response.type == RESPONSE_TYPES.OK) {

			var loading = document.getElementById("loading");
			loading.style.display = "inline";

			for (var i = response.data.length-1; i >= 0; i--) {
				CHATS.unshift(response.data[i]);
			}

			showChats(CHATS, function() {
				UPDATING = false;

				var m = response.message;
				m = m.substring(1, m.lastIndexOf("]"));
				CHATPOS = parseInt(m);

				if (CHATPOS > 0) CHATTIME = 0;

				document.getElementById("loadChatsBt").style.display = CHATPOS > 0 ? "inline-block" : "none";

				loading.style.display = "none";
			});
		}
	});
}

function loadChats() {
	clearChatArea();
	readChats();
}

function addChat(chat) {
	if (CHANNEL == chat.user || (CHANNEL == chat.channel && chat.broadcast)) {
		showChat(chat, function() {
			receiveChat(chat);
		});
	} else {
		alert(chat.user + " sent a chat");
	}
}

function updateChat(chat, del) {
	if (chat.text !== "" && chat.file == "") {
		createTextDiv(chat.user, chat.text, null, chat.time, chat.state, false, true, del);
	}
	else if (chat.file !== "") {
		createDiv(chat.user, chat.text, null, chat.file, chat.time, chat.state, true, del);
	}
}

function receiveChat(chat) {
	wsReceiveChat(chat.user, chat.channel, chat.text, chat.file, chat.time, chat.state, function(response) {});
}

function deleteChat(tm) {
	var r = confirm("Delete this chat item?");
	if (r == true) {
		stopChat();
		wsDeleteChat(USERNAME, tm, function(response) {
			//alert(response.message);
			if (response.type == RESPONSE_TYPES.OK) {
				startChat();
			}
		});
	}
}

function editChat(tm) {
	alert("edit: " + tm + "\nThis feature is not implemented.");
}

function showChat(chat, callback) {
	if (chat.text !== "" && chat.file == "") {
		createTextDiv(chat.user, chat.text, null, chat.time, chat.state, false, false, false, callback);
	}
	else if (chat.file !== "") {
		createDiv(chat.user, chat.text, null, chat.file, chat.time, chat.state, false, false, callback);
	}
}

function showChats(chats, callback) {

	var show = function(n, sc) {

		if (n >= chats.length) {
			callback();
			return;
		}

		var chat = chats[n];
		CHATTIME = Math.max(CHATTIME, chat.time);
		showChat(chat, function() { show(n + 1); });
	};
	show(0);
}

function updateUserStatus(user) {
	var d1 = document.getElementById("stx" + user.name);
	var d2 = document.getElementById("tmx" + user.name);
	if (d1 !== null && d2 !== null) {
		var st = "<img src='" + MYWEB + (user.status == "1" ? "res/img/online.png" : "res/img/offline.png") + "'>&ensp;" +
			(user.status == "1" ? "online" : "offline");
		d1.innerHTML = st;
		d2.innerHTML = tsToDateTime(user.time);
	}
}

//===============================================

var smilies = [
	"smiling","wink","happy","happy2","happy3","happy4","s_smile","s_happy","s_happy2","s_happy3","s_happy4","s_laughing",
	"sad","unhappy","s_sad","s_sad2","s_sad3","s_sad4","confused","confused2","s_confused","s_confused2","surprised",
	"surprised2","suspicious","smile","smart","crying","crying2", "s_crying","angry","angry2","s_angry","in-love","kissing",
	"s_in-love","s_in-love2","s_kiss","tongue-out","s_sleeping","s_pain","s_sick","s_sweat","s_late","quiet","s_hungry",
	"s_cool","s_graduated","ill"
];

function makeSmiley() {
	var bf = [];
	bf.push("<tr>");
	for (var i=0; i < smilies.length; i++) {
		bf.push("<td><img src='" + MYWEB + "res/img/smilies/" + smilies[i] + ".png' class='smileImg' onclick='insertSmiley(" + i + ")'></td>");
		if ((i+1) % 6 == 0) bf.push("</tr><tr>");
	}

	if (bf[bf.length-1] == "</tr><tr>") bf[bf.length-1] = "</tr>"; else bf.push("</tr>");

	document.getElementById("smTable").innerHTML = bf.join("");
}

function showSmiley() {
	var sm = document.getElementById("smiles_div");
	var bt = document.getElementById("smileBt");

	if (sm.style.display == "inline") return hideSmiley();

	var br = bt.getBoundingClientRect();

	sm.style.display = "inline";
	sm.style.top = (br.top - 180) + "px";
	sm.style.left = br.left + "px";
}

function hideSmiley() {
	document.getElementById("smiles_div").style.display = "none";
}

function insertSmiley(n) {

	hideSmiley();

	var isOrContainsNode = function(ancestor, descendant) {
		var node = descendant;
		while (node) {
			if (node === ancestor) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	};

	var insertNodeOverSelection = function(node, containerNode) {
		var ok = false;
		try {
			if (typeof window.getSelection != "undefined") {
				var sel = window.getSelection();
				if (sel.getRangeAt != null && sel.rangeCount != null) {
					var range = sel.getRangeAt(0);
					if (isOrContainsNode(containerNode, range.commonAncestorContainer)) {
						range.deleteContents();
						range.insertNode(node);
						ok = true;
					}
					else {
						containerNode.appendChild(node);
						ok = true;
					}
				}
			}
			else if (document.selection && document.selection.createRange) {
				var range = document.selection.createRange();
				if (isOrContainsNode(containerNode, range.parentElement())) {
					var html = (node.nodeType == 3) ? node.data : node.outerHTML;
					range.pasteHTML(html);
					ok = true;
				}
				else {
					containerNode.appendChild(node);
					ok = true;
				}
			}
		} catch(err) {}

		if (!ok) containerNode.innerHTML += node.outerHTML;
	};

	var img = document.createElement("img");
	img.src = "res/img/smilies/" + smilies[n] + ".png";
	insertNodeOverSelection(img, document.getElementById("chatText"));
}

//===============================================

function sendText() {
	hideSmiley();
	var tx = document.getElementById("chatText");
	var sx = tx.innerHTML;
	if (sx.length > 0) {
		createTextDiv(USERNAME, sx, null, timestamp(), "1", true, false, false);
		tx.innerHTML = "";
	}
}

function sendFile(evt){
	hideSmiley();
	var files = evt.target.files;
	if (files.length > 0) {
		var f = files[0];
		setTimeout(function() {
			var tx = document.getElementById("chatText");
			var sx = tx.innerHTML;
			createDiv(USERNAME, sx, f, f.name, timestamp(), "1", false, false);
			tx.innerHTML = "";
		}, 500);
	}
}

function sendAvatar(evt){
	var files = evt.target.files;
	if (files.length > 0 &&	getFileType(files[0].name).isimage) {
		USAVATAR = files[0];
		document.getElementById("n_avatar").value = USAVATAR.name;
	}
}

//====================================================================
//
// LAYOUT
//
//====================================================================

function initLayout(parent, type) {

	try {
		var 
			width,
			height,
			divs = [],

			rows = [],
			rowsAbs = [],
			rowsRel = [],

			cols = [],
			colsAbs = [],
			colsRel = [];

		if (parent == null) {
			parent = document.body;
			width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
			height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
			type = "row";
		}
		else {
			width = parent.xdata.width;
			height = parent.xdata.height;
		}

		for (var i = 0; i < parent.childNodes.length; i++) {

			var div = parent.childNodes[i];

			if (div.tagName && div.tagName == "DIV") {

				var atr = div.getAttribute("layout");

				if (atr) {

					var ats = atr.split(";");
					var map = {};

					for (var j=0; j < ats.length; j++) {
						var ls = ats[j].split(":");
						if (ls.length == 2) {
							map[ls[0].trim()] = ls[1].trim();
						}
					}
					
					/*
					var bw = parseInt(+getComputedStyle(div).borderLeftWidth.slice(0, -2)) +
							parseInt(+getComputedStyle(div).borderRightWidth.slice(0, -2));

					var bh = parseInt(+getComputedStyle(div).borderTopWidth.slice(0, -2)) + 
							parseInt(+getComputedStyle(div).borderBottomWidth.slice(0, -2));
					*/
					
					div.xdata = {
						"swidth": map["width"],
						"sheight": map["height"],
						"border": map["border"],
						"background": map["bg"],
						"left": 0,
						"top": 0,
						"width": 0,
						"height": 0,
						"br": 0,
						"bl": 0,
						"bt": 0,
						"bb": 0,
					};

					divs.push(div);
				}
			}
		}

		//=== layouting

		if (type == "row") type = "col"; else type = "row";

		for (var i = 0; i < divs.length; i++) {

			var div = divs[i];

			if (div.xdata.border) {
				var bs = div.xdata.border.split(",");
				if (bs[0]) div.xdata.bt = parseInt(bs[0]);
				if (bs[1]) div.xdata.br = parseInt(bs[1]);
				if (bs[2]) div.xdata.bb = parseInt(bs[2]);
				if (bs[3]) div.xdata.bl = parseInt(bs[3]);
			}

			if (type == "row") {
				rows.push(div);
				if (div.xdata.sheight.lastIndexOf("px") != -1) rowsAbs.push(div);
				else if (div.xdata.sheight.lastIndexOf("%") != -1) rowsRel.push(div);
			}
			else if (type == "col") {
				cols.push(div);
				if (div.xdata.swidth.lastIndexOf("px") != -1) colsAbs.push(div);
				else if (div.xdata.swidth.lastIndexOf("%") != -1) colsRel.push(div);
			}
		}

		//=== rows

		var hh = 0;
		for (var i = 0; i < rowsAbs.length; i++) {
			var div = rowsAbs[i];
			var hs = div.xdata.sheight;
			var hi = parseInt(hs.substring(0, hs.lastIndexOf("px")));
			div.xdata.height = hi - div.xdata.bt - div.xdata.bb;
			div.xdata.width = width;
			hh += hi;
		}

		hh = height - hh;
		for (var i = 0; i < rowsRel.length; i++) {
			var div = rowsRel[i];
			var hs = div.xdata.sheight;
			var hi = parseInt(hs.substring(0, hs.lastIndexOf("%")));
			hi = hh * hi / 100;
			div.xdata.height = hi - div.xdata.bt - div.xdata.bb;
			div.xdata.width = width - div.xdata.bl - div.xdata.br;
		}

		var t = 0;
		for (var i = 0; i < rows.length; i++) {
			var div = rows[i];
			div.xdata.left = div.xdata.bl;
			div.xdata.top = t + div.xdata.bt;
			t += div.xdata.height + div.xdata.bt + div.xdata.bb;
		}

		//=== cols

		var ww = 0;
		for (var i = 0; i < colsAbs.length; i++) {
			var div = colsAbs[i];
			var ws = div.xdata.swidth;
			var wi = parseInt(ws.substring(0, ws.lastIndexOf("px")));
			div.xdata.width = wi - div.xdata.bl - div.xdata.br;
			div.xdata.height = height;
			ww += wi;
		}

		ww = width - ww;
		for (var i = 0; i < colsRel.length; i++) {
			var div = colsRel[i];
			var ws = div.xdata.swidth;
			var wi = parseInt(ws.substring(0, ws.lastIndexOf("%")));
			wi = ww * wi / 100;
			div.xdata.width = wi - div.xdata.bl - div.xdata.br;
			div.xdata.height = height - div.xdata.bt - div.xdata.bb;
		}

		var l = 0;
		for (var i = 0; i < cols.length; i++) {
			var div = cols[i];
			div.xdata.left = l + div.xdata.bl;
			div.xdata.top = div.xdata.bt;
			l += div.xdata.width + div.xdata.bl + div.xdata.br;
		}

		//=== styling

		for (var i = 0; i < divs.length; i++) {

			var div = divs[i];

			div.style.position = "absolute";
			div.style.left = div.xdata.left + "px";
			div.style.top = div.xdata.top + "px";
			div.style.width = div.xdata.width + "px";
			div.style.height = div.xdata.height + "px";

			if (div.xdata.background) div.style.background = div.xdata.background;

			initLayout(div, type);
		}
	} catch(e) { alert(e.message); }
}

function initLayoutListener() {
	var name = "resize";
	var isMobile = {
		Android: function() { return /Android/i.test(navigator.userAgent); },
		iOS: function() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }
	};
	
	if (isMobile.Android()) name = "resize";
	else if (isMobile.iOS()) name = "orientationchange";

	window.addEventListener(name, function () { 
		initLayout(); 
	});
}

initLayoutListener();
