
// 4konverta API is availabele at http://code.google.com/p/4k-api/wiki/ApiDescription

// Ubiquity docs:
// https://wiki.mozilla.org/Labs/Ubiquity
// https://wiki.mozilla.org/Labs/Ubiquity/Ubiquity_0.5_Author_Tutorial

Envelopes = {
	_userInfo: null,
	_reqId: 0
};

Envelopes.API_APP_ID = "a40194378";
Envelopes.API_VERSION = "1.1";

Envelopes.Headers = {
	APP_ID: "4KApplication",
	AUTH: "4KAuth",
	VERSION: "4KVersion"
};

Envelopes.Prefs = {
	USERNAME: "ubiquity.4konverta.username",
	PASSWORD: "ubiquity.4konverta.password"
};

Envelopes.getBaseURL = function() {
	return 'https://www.4konverta.com';
}

Envelopes.getUserInfo = function() {
	return Envelopes._userInfo;
}

Envelopes.setPrefValue = function (name, value) {
    if (!Application.prefs.has(name)) {
        Application.prefs.setValue(name, value);
        return value;
    } else {
        var new_val = Application.prefs.get(name);
        new_val.value = value;
        return new_val.value;
    }
}

Envelopes.deletePrefValue = function (name) {
    if (Application.prefs.has(name)) {
        var val = Application.prefs.get(name);
		val.reset();
    }
}

Envelopes.getPrefValue = function (name) {
	if (name == null) {
		return null;
	}
	if (Application.prefs.has(name)) {
		var value = Application.prefs.get(name);
		return value != null ? value.value : null;
	}
	return null;
}

Envelopes.setAuthInfo = function(name, password) {
	// TODO: use password manager to store login/password instead of preferences
	Envelopes.setPrefValue(Envelopes.Prefs.USERNAME, name);
	Envelopes.setPrefValue(Envelopes.Prefs.PASSWORD, password);	
	return;
}

Envelopes.clearAuthInfo = function() {
	Envelopes.deletePrefValue(Envelopes.Prefs.USERNAME);
	Envelopes.deletePrefValue(Envelopes.Prefs.PASSWORD);	
	return;
}

Envelopes.getAuthInfo = function() {
	var auth = {
		name: Envelopes.getPrefValue(Envelopes.Prefs.USERNAME),
		password: Envelopes.getPrefValue(Envelopes.Prefs.PASSWORD)
	};	
	return auth;
}

Envelopes.isAuthInfoValid = function (authInfo) {
	if (authInfo == null || authInfo.name == null || authInfo.password == null
		|| authInfo.name.length < 1 || authInfo.password.length < 1) {
		//CmdUtils.log('authInfo is NOT VALID');
		return false;
	}
	//CmdUtils.log('authInfo is VALID');
	return true;
}

Envelopes.API = {
	USER_INFO:  "/data/${user}",
	ENVELOPE: "/data/${user}/envelope/${envelopeBegin} ",
	DAILY_EXPENSE: "/data/${user}/dailyExpense/${personId}/${date}",
	EXECUTION: "/data/${user}/execution/${envelopeBegin}",
	INCOME: "/data/${user}/actualIncome/${incomeId}/${plannedDate}",
	GOAL_CREDIT: "/data/${user}/actualGoalCredit/${goalId}/${plannedDate}",
	ACTUAL_EXPENSE: "/data/${user}/actualExpense/${expenseId}/${plannedDate}"
};

Envelopes.setRequestHeaders = function(xhr, authInfo) {
	xhr.setRequestHeader(Envelopes.Headers.APP_ID, Envelopes.API_APP_ID);
	xhr.setRequestHeader(Envelopes.Headers.VERSION, Envelopes.API_VERSION);
	if (authInfo && authInfo.password) {
		xhr.setRequestHeader(Envelopes.Headers.AUTH, authInfo.password);
	} else {
		CmdUtils.log('[setRequestHeaders] authInfo is invalid');
	}
}

/**
 * Default handler for unsuccessful ajax requests.
 */
Envelopes.handleAjaxError = function(pblock, req, textStatus, errorThrown) {
	if (req.status == 401) {
		pblock.innerHTML = '<h1>Login failed</h1>'
			+ 'Please check that you set correct login in <b>4k-login</b> command'
			+ ' and also verify if you can log in at '
			+ '<a href="https://www.4konverta.com/">https://www.4konverta.com/</a>';
	} else {
		pblock.innerHTML = '<h1>Unknown error</h1>';
	}
}

/**
 * Default handler for successful ajax requests. Renders XML document in preview window.
 */
Envelopes.renderXml = function(pblock, data, textStatus) {
	pblock.innerHTML = '<b>Preview not implemented, displaying raw data</b><hr/>'
		+ data.replace(/</g,'&lt;');
}

Envelopes.MSG_USER_INFO = '<font size="+2"><b>${auth.name}</b> \
({for p in user.persons}<b>${p.name}</b> {if p != user.persons[user.persons.length-1]}, {/if}{/for})</font><br/>\
<div>Accounts:<table> \
{for a in user.accounts} \
	<tr><td><b>${a.name}</b></td><td>${a.value}</td></tr> \
{forelse} \
	No accounts defined\
{/for} \
</table></div>';

Envelopes.handleUserInfo = function(pblock, data, textStatus) {
	var rawData = data.replace(/</g,'&lt;');
	var userInfo = Envelopes.parseUserInfo(data);
	//CmdUtils.log(userInfo);
	var authInfo = Envelopes.getAuthInfo();
	pblock.innerHTML = CmdUtils.renderTemplate(Envelopes.MSG_USER_INFO, {user: userInfo, auth: authInfo});;
}

Envelopes.parseUserInfo = function (data) {
	var user = {_data: data};
	var $ = jQuery;
	var $u = $(data);

	$u.find('country').each(function() {
		user.country = {
			code: $(this).attr('code'),
			name: $(this).text()
		};
	});
	$u.find('currency').each(function() {
		user.currency = {
			code: $(this).attr('code'),
			name: $(this).text()
		};
	});
	
	user.firstDayOfWeek  = $u.find('firstDayOfWeek').text();
	user.timeZone  = $u.find('timeZone').text();
	user.disableExtendedSyntax  = $u.find('disableExtendedSyntax').text();

	user.persons = [];
	$u.find('persons').find('person').each(function(){
		user.persons.push({
			id: $(this).attr('id'),
			name: $(this).attr('name')
		});
	});
	
	user.accounts = [];
	$u.find('accounts').find('account').each(function(){
		var account =
		{
			id: $(this).attr('id'),
			name: $(this).attr('name'),
			value: $(this).find('value').text()
		};
		$(this).find('currency').each(function() {
			account.currency = {
				code: $(this).attr('code'),
				name: $(this).text()
			};
		});
		user.accounts.push(account);
	});
	return user;
}

Envelopes.sendAjaxRequest = function(async, pblock, resource, onSuccess, onError) {
	var authInfo = Envelopes.getAuthInfo();
	if ( !Envelopes.isAuthInfoValid(authInfo) ) {
		var msg = _('Your username/password information is not set.'
			+' Please use <b>4k-login</b> command to set your username and password and try again.');
		pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name, url: url});
		return;
	}
	var url = CmdUtils.renderTemplate(Envelopes.getBaseURL() + resource, 
		{user: authInfo.name});
	var msg = _('Loading information for user "<b>${user}</b>"...');
	pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name});
	
	var successHandler = onSuccess || Envelopes.renderXml;
	var errorHandler = onError || Envelopes.handleAjaxError;
	
	jQuery.ajax({
		type: 'POST',
		url: url,
		beforeSend: function(xhr) {
			Envelopes.setRequestHeaders(xhr, authInfo);
			return true;
		},
		success: function(data, textStatus) {
			successHandler.call(this, pblock, data, textStatus);
		},
		error: function(req, textStatus, errorThrown) {
			errorHandler.call(this, pblock, req, textStatus, errorThrown);
		}
	});
	
}

CmdUtils.CreateCommand({
	names: ["4k info"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Get user info from www.4konverta.com",
	help: "",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	arguments: [{role: 'object', nountype: noun_arb_text}],

	preview: function preview(pblock, args) {
		var authInfo = Envelopes.getAuthInfo();
		Envelopes.sendAjaxRequest(true, pblock, Envelopes.API.USER_INFO, Envelopes.handleUserInfo, null);
	},
	execute: function execute(args) {
		//displayMessage("You selected: " + args.object.text, this);
	}
});

CmdUtils.CreateCommand({
	names: ["4k login"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Sets the login name and password for www.4konverta.com",
	help: "Specify user name and password for www.4konverta.com.<br/>Example: <b>4k-login myname with secr3t</b>",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	arguments: [{role: 'object', nountype: noun_arb_text},
		{role: 'instrument', nountype: noun_arb_text, label: 'password'}
	],

	preview: function preview(pblock, args) {
		var msg = this.help;
		var authInfo = Envelopes.getAuthInfo();
		if ( Envelopes.isAuthInfoValid(authInfo) ) {
			msg += _('<hr/>Current login name: <b>${name}</b>');
		} else {
			msg += _('<hr/>No login information available');
		}
		pblock.innerHTML = CmdUtils.renderTemplate(msg, authInfo);
	},
	execute: function execute(args) {
		if (args.object.text.length < 1) {
			displayMessage("Please specify user name.<br/>Example: <b>4k-login myname with secr3t</b>", this);
			return;
		}
		if (args.instrument.text.length < 1) {
			displayMessage("Please specify password.<br/>Example: <b>4k-login myname with secr3t</b>", this);
			return;
		}
		Envelopes.setAuthInfo(args.object.text, args.instrument.text);
		displayMessage("Saved password for user " + args.object.text, this);
	}
});

CmdUtils.CreateCommand({
	names: ["4k logout"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Clears login name and password for www.4konverta.com from internal settings",
	help: "Execute this command to clear login name and password from internal settings.<br/>Example: <b>4k-logout</b>",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	preview: function preview(pblock, args) {
		var msg = this.help;
		var authInfo = Envelopes.getAuthInfo();
		if ( Envelopes.isAuthInfoValid(authInfo) ) {
			msg += _('<hr/>Current login name: <b>${name}</b>');
		} else {
			msg += _('<hr/>No login information available');
		}
		pblock.innerHTML = CmdUtils.renderTemplate(msg, authInfo);;
	},
	execute: function execute(args) {
		Envelopes.clearAuthInfo();
		displayMessage('Login information cleared', this);
	}
});

