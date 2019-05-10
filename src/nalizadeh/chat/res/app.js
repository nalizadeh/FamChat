
//===============================
// WebSocket
//===============================

var onCallback = null;

const MYWEB = "http://localhost:8080/";
const MYWEBS = "ws://localhost:8181/";

//const MYWEB = "https://nalizadeh.dynv6.net:443/";
//const MYWEBS = "wss://nalizadeh.dynv6.net:444/";

const FILESURL = MYWEB + "db/files/";

const socket = new WebSocket(MYWEBS);

/*

keytools:
https://help.marklogic.com/Knowledgebase/Article/View/572/0/using-keystore-explorer-to-generate-ca-root-and-end-user-ssl-certificates-for-marklogic-server

openssl:
https://thomas-leister.de/selbst-signierte-tls-zertifikate-mit-eigener-ca/
openssl genrsa -aes256 -out nalizadehCA.key 2048
openssl req -x509 -new -nodes -extensions v3_ca -key nalizadehCA.key -days 730 -out nalizadehCA.cer -sha512
openssl genrsa -out nalizadeh.dynv6.net.key 4096
openssl req -new -key nalizadeh.dynv6.net.key -out nalizadeh.dynv6.net.csr
openssl x509 -req -in nalizadeh.dynv6.net.csr -CA nalizadehCA.cer -CAkey nalizadehCA.key -CAcreateserial -out nalizadeh.dynv6.net.cer -days 365 -sha512
type nalizadehCA.cer >> nalizadeh.dynv6.net.cer

*/

socket.binaryType = "arraybuffer";

socket.onopen = function (event) {
};

socket.onmessage = function (event) {
	if (event.data instanceof ArrayBuffer) {
		onCallback(event.data);
	}
	else {
		var response = JSON.parse(event.data);

		// CONN_CLOSED, USER_LOGIN, USER_LOGOUT
		if (response.state == 3 || response.state == 4 || response.state == 5) {
			updateUserStatus(response.data);
		}
		// USER_UPDATED
		else if (response.state == 6) {
			updateUserAvatar(response.data);
		}
		// CHAT_ADDED
		else if (response.state == 7) {
			addChat(response.data, false);
		}
		// CHAT_DELETED
		else if (response.state == 8) {
			updateChatStatus(response.data, true);
		}
		// CHAT_UPDATED
		else if (response.state == 9) {
			updateChatStatus(response.data, false);
		}
		else if (onCallback != null) {
			onCallback(response);
		}
	}
};

socket.onerror = function (event) {
};

function sendMessage(msg, callback) {
	onCallback = callback;
	socket.send(msg instanceof ArrayBuffer ? msg : JSON.stringify(msg));
}

//===============================
//  WebSocket Calls
//===============================

var QUEUE = [];
var ACTIVE = false;

function showLoading(show, message, callback) {

	var loading = document.getElementById("chatloading");

	if (show) {
		if (ACTIVE) {
			QUEUE.push({ms:message, cb:callback});
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
			showLoading(true, queue.ms, queue.cb);
		}
	}
}

function wsRegister(username, password, email, callback) {
	var msg = {
		"command": "CreateUser",
		"name": username,
		"password": password,
		"email": email,
		"avatar": username + ".png",
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLogin(username, password, callback) {
	var msg = {
		"command": "Login",
		"name": username,
		"password": password
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLoginCookie(username, callback) {
	var msg = {
		"command": "LoginCookie",
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsLogout(username, callback) {
	var msg = {
		"command": "Logout",
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetUser(callback) {
	var msg = {
		"command": "GetUser",
		"name": USERNAME
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsUpdateUser(username, email, password, avatar, callback) {
	var msg = {
		"command": "UpdateUser",
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
		"command": "DeleteUser",
		"name": username
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetAllUsers(callback) {
	var msg = {
		"command": "GetAllUsers"
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetContacts(user, callback) {
	var msg = {
		"command": "GetContacts",
		"name": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsAddContact(user, contact, callback) {
	var msg = {
		"command": "AddContact",
		"name": user,
		"contact": contact
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsRemoveContact(user, contact, callback) {
	var msg = {
		"command": "RemoveContact",
		"name": user,
		"contact": contact
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetGroups(user, callback) {
	var msg = {
		"command": "GetGroups",
		"name": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsCreateGroup(group, owner, callback) {
	var msg = {
		"command": "CreateGroup",
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
		"command": "DeleteGroup",
		"name": group
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsGetAllGroups(callback) {
	var msg = {
		"command": "GetAllGroups"
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsAddToGroup(group, user, callback) {
	var msg = {
		"command": "AddToGroups",
		"name": group,
		"member": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsRemoveFromGroup(group, user, callback) {
	var msg = {
		"command": "RemoveFromGroups",
		"name": group,
		"member": user
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsWriteChat(user, channel, text, file, time, callback) {
	var msg = {
		"command": "WriteChat",
		"user": user,
		"channel": channel,
		"text": text,
		"file": file,
		"time": time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsReadChat(user, channel, time, callback) {
	var msg = {
		"command": "ReadChat",
		"user": user,
		"channel": channel,
		"time" : time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsDeleteChat(user, time, callback) {
	var msg = {
		"command": "DeleteChat",
		"user": user,
		"time" : time
	};
	showLoading(true, msg, function(response) {
		callback(response);
	});
}

function wsUpdateChat(user, tm, text, file, time, callback) {
	var msg = {
		"command": "UpdateChat",
		"user": user,
		"channel": channel,
		"text": text,
		"file": file,
		"time": time
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
			"command": "UploadFile",
			"user": user,
			"name": name,
			"avatar" : isAvatar
		};
		showLoading(true, msg, function(resp1) {
			if (resp1.state == 0) {
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

	showLoading(true, {"command": "DownloadFile", "name": name}, function(response) {
		saveByteArray([response], name);
	});
}

function wsLoadImage(id, name) {
	var msg = {
		"command": "DownloadFile",
		"name": name
	};
	showLoading(true, msg, function(response) {
		let url = window.URL.createObjectURL(new Blob([response]));
		document.getElementById(id).src = url;
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

function calculateWinSize() {
	var ca = document.getElementById("chatArea");
	var cn = document.getElementById("channelsArea");
	var dm = getWindowSize();
	//ca.style.width = (dm.width - cn.offsetWidth - 4) + "px";
	ca.style.height = (dm.height-160) + "px";
	cn.style.height = (dm.height-124) + "px";
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

//======= LOGIN / SIGNUP ========

var USERNAME = null;
var USAVATAR = null;
var CHANNEL = null;
var CHAVATAR = null;
var TIME = 0;
var UPDATELOOP = false;
var GROUPS = null;
var UPLOADING = false;
var UPDATING = false;

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

	var ua = USERNAME ? ("<img class='userAvatar' id='usAvImg" + USERNAME + "' src='" + FILESURL + "avatar/" + USAVATAR + "'>") : "";

	var cn = CHANNEL ?
		"<table border=0 cellpadding=0 cellspacing=0><tr>" +
		"<td>Channel:</td>" +
		"<td><img class='channelAv' id='chAvImg" + CHANNEL + "' src='" + FILESURL + "avatar/" + CHAVATAR + "'></td>" +
		"<td>" + CHANNEL + "</td></tr></table>" : USERNAME ?
		"<span id='channelSp'>No channel</span>" : "";

	document.getElementById("usericoSp").innerHTML = ua;
	document.getElementById("usernameSp").innerHTML = USERNAME ? USERNAME : "";
	document.getElementById("channelDv").innerHTML = cn;
	document.getElementById("settingBt").style.display = USERNAME ? "inline-block" : "none";
	document.getElementById("logoutBt").style.display = USERNAME ? "inline-block" : "none";
	document.getElementById("closeChannelBt").style.display = CHANNEL ? "inline-block" : "none";
	document.getElementById("chatControls").style.visibility = USERNAME ? "visible" : "hidden";
	document.getElementById("login_div").style.display = USERNAME ? "none" : "inline";
	document.getElementById("login_signup_box").style.display = USERNAME ? "none" : "inline";
	document.getElementById("attachBt").style.pointerEvents = CHANNEL ? "auto" : "none";
	document.getElementById("smileBt").style.pointerEvents = CHANNEL ? "auto" : "none";
	document.getElementById("sendBt").style.pointerEvents = CHANNEL ? "auto" : "none";
	document.getElementById("attachBt").style.opacity = CHANNEL ? 1 : 0.3;
	document.getElementById("smileBt").style.opacity = CHANNEL ? 1 : 0.3;
	document.getElementById("sendBt").style.opacity = CHANNEL ? 1 : 0.3;
	document.getElementById("chatText").style.background = CHANNEL ? "#FFF" : "#eee";
	document.getElementById("chatArea").innerHTML = "";

	clearChatArea();

	if (cookieLogin && USERNAME != null) {
		setTimeout(function() {
			wsLoginCookie(USERNAME, function(response) {
				//alert(response.message);

				if (response.state == 0 && CHANNEL) {
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

function register() {

	var username = document.getElementById("username2").value;
	var password = document.getElementById("password2").value;
	var email = document.getElementById("email").value;
	var password2 = document.getElementById("password3").value;

	if (username.length == 0) { alert("Wrong username!"); return; }
	if (email.length == 0) { alert("Wrong email!"); return; }
	if (password.length == 0) { alert("Wrong password!"); return; }
	if (password !== password2) { alert("Wrong password!"); return; }

	wsRegister(username, password, email, function(response) {
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

		avatar = USERNAME + getFileType(USAVATAR).type;

		var windowURL = window.URL || window.webkitURL;
		var picURL = windowURL.createObjectURL(USAVATAR);
		var img = new Image();

		img.onload = function() {
			wsUploadFile(USAVATAR, USERNAME, true, function(response, name) {
				if (response.state == 0) {
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
		if (response.state !== 0) {
			alert(response.message);
		}
		else {
			endLogin(true);
			updateActions(username, response.data.avatar);
		}
	});
}

function logout() {
	wsLogout(USERNAME, function(response) {
		if (response.state !== 0) {
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

function sendEmail() {
	alert("Not implemented");
}

function refresh() {
	location.reload();
}

//======= SETTINGS ========

function openSetting() {
	var ca = document.getElementById("chatArea");
	var sd = document.getElementById("setting_div");
	if (sd.style.display != "inline") {
		hideSmiley();
		closeChannels();
		if (FLEXLAYOUT == false) calculateWinSize();
		ca.style.opacity = 0.1;
		sd.style.display = "inline";
		startSetting();
	}
}

function closeSetting() {
	endSetting();
	document.getElementById("setting_div").style.display = "none";
	document.getElementById("chatArea").style.opacity = 1;
}

function startSetting() {
	document.getElementById("setting_box").style.display = "inline";
}

function endSetting() {
	document.getElementById("user_box").style.display = "none";
	document.getElementById("contacts_box").style.display = "none";
	document.getElementById("groups_box").style.display = "none";
	document.getElementById("setting_box").style.display = "none";
}

function getData(callback) {
	wsGetContacts(USERNAME, function(r1) {
		wsGetGroups(USERNAME, function(r2) {
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
			if (response.state == 0) {
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
			if (response.state == 0) {
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
			if (response.state == 0) {
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
			if (response.state == 0) {
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
			if (response.state == 0) {
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
			if (response.state == 0) {
				getData(function() {
					alert(response.message);
					if (CHANNEL == grp) closeChannel();
				});
			}
			else alert(response.message);
		});
	}
}

//======= CHANNELS ========

function makeChannelList() {
	if (USERNAME != null) {

		wsGetContacts(USERNAME, function(response1) {
			wsGetGroups(USERNAME, function(response2) {
				var data = [];
				for (var i=0; i < response1.data.length; i++) {
					var u = response1.data[i];
					data.push({name:u.name, email:u.email, avatar:u.avatar, time:u.time, status:u.status, isUser:true});
				}
				for (var i=0; i < response2.data.length; i++) {
					var g = response2.data[i];
					data.push({name:g.name, email:"", avatar:g.avatar, time:g.time, isUser:false});
				}
				if (data.length > 0) {
					var bf = [];
					bf.push("<ul>");
					for (var i=0; i < data.length; i++) {
						var d = data[i];
						var av = d.avatar === "*" ? (d.isUser ? "user.png" : "group.png") : d.avatar;

						var st = d.isUser ? ("<img src='" + MYWEB + (d.status == "1" ? "res/img/online.png" : "res/img/offline.png") + "'>&ensp;" +
						(d.status == "1" ? "online" : "offline")) : "";

						bf.push("<li onclick=\"openChannel('" + d.name + "','" + av + "')\">");
						bf.push("<table border=0, cellpadding=0, cellspacing=0>");
						bf.push("<tr><td class='avaImgTd'><img id='avaImg" + d.name + "' src='" + FILESURL + "avatar/" + av + "' width='48px' height='48px'></td><td><h3>" + d.name + "</h3></td></tr>");
						bf.push("<tr><td colspan=2><span class='lisp1' id='stx" + d.name + "'>" + st + "</span></td></tr>");
						bf.push("<tr><td colspan=2><span class='lisp2' id='tmx" + d.name + "'>" + tsToDateTime(d.time) + "</span></td></tr></table></li>");
					}
					bf.push("</ul>");
					document.getElementById("channelsArea").innerHTML = bf.join("");
				}
			});
		});
	}
}

function openChannels() {
	closeSetting();
	hideSmiley();

	var cn = document.getElementById(FLEXLAYOUT ? "channels" : "channelsArea");
	var ca = FLEXLAYOUT ? document.getElementById("channelsArea") : cn;

	if (cn.style.display != "block") {
		cn.style.display = "block";
		cn.style.width = "180px";
		ca.innerHTML = "<div style='width:100%; text-align:center; padding-top:20px;'><img src='" + MYWEB + "res/img/loading2.gif'/></div>";
		makeChannelList();
		document.getElementById("channelsBt").style.background = "url(" + MYWEB + "res/img/menuzu.png) no-repeat top left";
	}
	else closeChannels();
}

function closeChannels() {
	var cn = document.getElementById(FLEXLAYOUT ? "channels" : "channelsArea");
	var ca = FLEXLAYOUT ? document.getElementById("channelsArea") : cn;
	ca.innerHTML = "";
	cn.style.display = "none";
	cn.style.width = "0px";
	document.getElementById("channelsBt").style.background = "url(" + MYWEB + "res/img/menu.png) no-repeat top left";
}

function openChannel(channel, avatar) {
	if (!UPDATING && USERNAME != channel && CHANNEL != channel) {
		updateActions(USERNAME, USAVATAR, channel, avatar);
	}
}

function closeChannel() {
	updateActions(USERNAME, USAVATAR, null, null, true);
}

function updateUserAvatar(user) {
	var ui = document.getElementById("avaImg" + user.name);
	if (ui) ui.src = FILESURL + "avatar/" + user.avatar;

	ui = document.getElementById("usAvImg" + user.name);
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
		var fn = nm.split('\\').pop().split('/').pop();
		app.saveImage(FILESURL + "chats/" + nm, fn);
	}
	else {
		wsDownloadFile(nm);
	}
}

function createTextDiv(user, txt, tm, nm, ck, ispic, isfile, upload, update, del, callback) {

	if (del) {
		document.getElementById("fc_tx_" + tm).innerHTML = "";
		return;
	}

	var bt = user == USERNAME ?
		"<td><img class='chatBt' src='" + MYWEB + "res/img/delete.png' onclick=\"deleteChat('" + tm + "')\"></td>" +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/edit.png' onclick=\"editChat('" + tm + "')\"></td>" +
		(ispic || isfile ? "<td><img class='chatBt' src='" + MYWEB + "res/img/download.png' onclick=\"download('" + nm + "')\"></td>" : "") +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/forward.png' onclick=\"forwardChat('" + tm + "')\">" :

		(ispic || isfile ? "<td><img class='chatBt' src='" + MYWEB + "res/img/download.png' onclick=\"download('" + nm + "')\"></td>" : "") +
		"<td><img class='chatBt' src='" + MYWEB + "res/img/forward.png' onclick=\"forwardChat('" + tm + "')\">";

	var ch = user == USERNAME ? "<td><img src='" + MYWEB + "res/img/" + (ck == "1" ? "check.png" : "check2.png") + "' id='ck" + tm + "'></td>" : "";
	var ih = "<table border=0 cellpadding=2 cellspacing=0><tr><td><span class='chatInfo'>" + user + ": (" +
		tsToDateTime(tm) + ")</span></td>" + bt + ch + "</tr></table>" + (ispic ? "" : "<br>" + txt);

	if (update) {
		document.getElementById("fc_tx_" + tm).innerHTML = ih;
		return;
	}

	var ta = document.getElementById("chatAreaTable");

	var tr = document.createElement("tr");
	var td = document.createElement("td");
	var dv = document.createElement("div");

	var tr2 = document.createElement("tr");
	var td2 = document.createElement("td");
	var dv2 = document.createElement("div");

	td.className = user == USERNAME ? "chattdTo" : "chattdFrom";
	dv.className = user == USERNAME ? "chatspanTo" : "chatspanFrom";
	dv.innerHTML = ih;
	dv.id = "fc_tx_" + tm;

	dv2.innerHTML = "<img src='" + MYWEB + "res/img/" + (user == USERNAME ? "bubto" : "bubfrom") + ".png'>";
	dv2.style.cssText = (user == USERNAME ? "padding-left:20px; float:left;" : "padding-right:20px; float:right;");

	td.appendChild(dv);
	tr.appendChild(td);
	td2.appendChild(dv2);
	tr2.appendChild(td2);

	ta.appendChild(tr);
	ta.appendChild(tr2);
	dv2.scrollIntoView();

	if (upload) {
		UPLOADING = true;
		wsWriteChat(USERNAME, CHANNEL, txt, "", tm, function() {
			TIME = timestamp();
			UPLOADING = false;
			if (callback) callback();
		});
	}
	else if (callback) callback();
}

function createImageDiv(user, file, name, tm, ck, update, del, callback) {

	if (del) {
		createTextDiv(user, null, tm, name, ck, true, false, false, false, del);
		document.getElementById("fc_imdv_" + tm).innerHTML = "";
		if (callback) callback();
		return;
	}
	if (update) {
		createTextDiv(user, null, tm, name, ck, true, false, false, update, false);
		document.getElementById("fc_im_" + tm).src = FILESURL + "chats/" + name;
		if (callback) callback();
		return;
	}

	var ta = document.getElementById("chatAreaTable");
	var tr = document.createElement("tr");
	var td = document.createElement("td");
	var uri = window.URL || window.webkitURL;
	var pic = file ? uri.createObjectURL(file) : FILESURL + "chats/" + name;
	var div = document.createElement("div");
	var img = document.createElement("img");

	div.id = "fc_imdv_" + tm;
	div.className = user == USERNAME ? "chatimgTo" : "chatimgFrom";
	td.className = user == USERNAME ? "chattdTo" : "chattdFrom";
	img.id = "fc_im_" + tm;
	img.className = "chatImage";

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

		div.appendChild(img);
		div.scrollIntoView();

		if (file) {
			UPLOADING = true;
			setTimeout(function() {
				wsUploadFile(file, USERNAME, false, function(response, name) {
					wsWriteChat(USERNAME, CHANNEL, "", name, tm, function() {
						uri.revokeObjectURL(pic);
						TIME = timestamp();
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

	createTextDiv(user, null, tm, name, ck, true, false, false, false, false);

	td.appendChild(div);
	tr.appendChild(td);
	ta.appendChild(tr);
}

function createVideoDiv(user, file, name, tm, ck, update, del, callback) {
	if (del) {
		createTextDiv(user, null, tm, name, ck, false, true, false, false, del);
		document.getElementById("fc_vidv_" + tm).innerHTML = "";
		if (callback) callback();
		return;
	}
	if (update) {
		createTextDiv(user, null, tm, name, ck, false, true, false, update, false);
		document.getElementById("fc_vi_" + tm).src = FILESURL + "chats/" + name;
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
	vid.src = FILESURL + "chats/" + name;
	vid.poster = name;
	vid.controls = false;
	vid.autoPlay = true;
	vid.preload = true;
	vid.loop = true;

	vid.onloadeddata = function() {

		var ws = getWindowSize();
		var dim = resizeImage(vid.videoWidth, vid.videoHeight, ws.width / 2.5, 300);
		vid.width = dim.width;
		vid.style.margin = "10px";
		vid.style.cursor = "pointer";

		div.appendChild(vid);
		div.scrollIntoView();
	};

	vid.onclick = function(e) {
		if (vid.paused) vid.play(); else vid.pause();
	};

	vid.onerror = function() {
		if (callback) callback();
	};

	createTextDiv(user, null, tm, name, ck, true, false, false, false, false);

	td.appendChild(div);
	tr.appendChild(td);
	ta.appendChild(tr);

	if (file) {
		UPLOADING = true;
		setTimeout(function() {
			wsUploadFile(file, USERNAME, false, function(response, name) {
				wsWriteChat(USERNAME, CHANNEL, "", name, tm, function() {
					TIME = timestamp();
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

function createAudioDiv(user, file, name, tm, ck, update, del, callback) {
}

function createFileDiv(user, file, name, tm, ck, update, del, callback) {

	if (del) {
		createTextDiv(user, null, tm, name, ck, false, true, false, false, del);
		if (callback) callback();
		return;
	}
	if (update) {
		createTextDiv(user, null, tm, name, ck, false, true, false, update, false);
		if (callback) callback();
		return;
	}

	createTextDiv(user, "<img src='" + MYWEB + "res/img/attachment.png'> " + name, tm, name, ck, false, true, false, false, false);

	if (file) {
		UPLOADING = true;
		setTimeout(function() {
			wsUploadFile(file, USERNAME, false, function(response, name) {
				wsWriteChat(USERNAME, CHANNEL, "", name, tm, function() {
					TIME = timestamp();
					UPLOADING = false;
					if (callback) callback();
				});
			});
		}, 1000);
	}
	else if (callback) callback();
}

function createDiv(user, file, name, tm, ck, update, del, callback) {

	var ft = getFileType(name);
	if (ft.isimage) {
		createImageDiv(user, file, name, tm, ck, update, del, callback);
	}
	else if (ft.isvideo) {
		createVideoDiv(user, file, name, tm, ck, update, del, callback);
	}
	else if (ft.isaudio) {
		createAudioDiv(user, file, name, tm, ck, update, del, callback);
	}
	else {
		createFileDiv(user, file, name, tm, ck, update, del, callback);
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
	TIME = 0;
	clearChatArea();
}

function readChats() {
	//stopChat();
	UPDATING = true;
	wsReadChat(USERNAME, CHANNEL, TIME, function(response) {
		if (response.state == 0) {
			showChats(response.data, function() {
				UPDATING = false;
			});
		}
	});
}

function updateChat() {
}

function deleteChat(tm) {
	var r = confirm("Delete this chat item?");
	if (r == true) {
		stopChat();
		wsDeleteChat(USERNAME, tm, function(response) {
			alert(response.message);
			if (response.state == 0) {
				startChat();
			}
		});
	}
}

function editChat(tm) {
	alert("edit: " + tm + "\nThis feature is not implemented.");
}

function addChat(chat, callback) {
	//if (CHANNEL == chat.user) {
	if (chat.text !== "") {
		createTextDiv(chat.user, chat.text, chat.time, null, chat.state, false, false, false, false, false, callback);
	}
	else if (chat.file !== "") {
		createDiv(chat.user, null, chat.file, chat.time, chat.state, false, false, callback);
	}
	//}
}

function showChats(chats, callback) {

	var show = function(n, sc) {

		if (n >= chats.length) {
			callback();
			return;
		}

		var chat = chats[n];
		TIME = Math.max(TIME, chat.time);
		addChat(chat, function() { show(n + 1); });
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

function updateChatStatus(chat, del) {
	if (chat.text !== "") {
		createTextDiv(chat.user, chat.text, chat.time, null, chat.state, false, false, false, true, del);
	}
	else if (chat.file !== "") {
		createDiv(chat.user, null, chat.file, chat.time, chat.state, true, del);
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

	sm.style.display = "inline";
	sm.style.top = (bt.offsetTop - 190) + "px";
	sm.style.left = (bt.offsetLeft - 240) + "px";
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
	var tx = document.getElementById("chatText");
	var sx = tx.innerHTML.split(";").join("|").trim();

	if (sx.length > 0) {
		createTextDiv(USERNAME, sx, timestamp(), null, "1", false, false, true, false, false);
		tx.innerHTML = "";
	}
}

function sendFile(evt){
	var files = evt.target.files;
	if (files.length > 0) {
		var f = files[0];
		setTimeout(function() {
			createDiv(USERNAME, f, f.name, timestamp(), "1", false, false);
		}, 500);
	}
}

function sendAvatar(evt){
	var files = evt.target.files;
	if (files.length > 0 &&	getFileType(files[0]).isimage) {
		USAVATAR = files[0];
		document.getElementById("n_avatar").value = USAVATAR.name;
	}
}
