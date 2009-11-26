
// 4konverta API is availabele at
// http://code.google.com/p/4k-api/wiki/ApiDescription

// Ubiquity docs:
// https://wiki.mozilla.org/Labs/Ubiquity
// https://wiki.mozilla.org/Labs/Ubiquity/Ubiquity_Source_Tip_Author_Tutorial
// https://wiki.mozilla.org/Labs/Ubiquity/Ubiquity_0.5_Author_Tutorial
// https://wiki.mozilla.org/Labs/Ubiquity/Writing_Noun_Types
// http://code.google.com/p/trimpath/wiki/JavaScriptTemplates

Envelopes = {
	_userInfo: null,
	_reqId: 0
};
CmdUtils.log('Unitializing 4konverta...');

DEBUG=true;
DEBUG2=false;

Envelopes.debug = function(data) {
	if (DEBUG) {
		CmdUtils.log(data);
	}
}

Envelopes.debug2 = function(data) {
	if (DEBUG2) {
		CmdUtils.log(data);
	}
}

Envelopes.API_APP_ID = "a40194378";
Envelopes.API_VERSION = "1.1";

Envelopes.Headers = {
	APP_ID: "4KApplication",
	AUTH: "4KAuth",
	VERSION: "4KVersion"
};

Envelopes.Prefs = {
	PERSON: "4konverta.person",
	ACCOUNT: "4konverta.account",
	CURRENCY: "4konverta.currency"
};

Envelopes.getBaseURL = function() {
	return 'https://www.4konverta.com';
}

Envelopes.getUserInfo = function() {
	return Envelopes._userInfo;
}

Envelopes.setUserInfo = function(user) {
	Envelopes._userInfo = user;
}

Envelopes.reset = function() {
	Envelopes._userInfo = null;
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

// arg is an noun_type object retreived as one of command args
Envelopes.getCurrentPersonId = function(arg) {
	var personId = null;
	if (arg != null && arg.data) {
		personId = arg.data;
	}
	if (personId == null) {
		personId = Envelopes.getPrefValue(Envelopes.Prefs.PERSON);
	}
	//Envelopes.debug('getCurrentPersonId: ' + personId);
	return personId;
}

// arg is an noun_type object retreived as one of command args
Envelopes.getCurrentPerson = function(arg) {
	var personId = Envelopes.getCurrentPersonId(arg);
	var userInfo = Envelopes.getUserInfo();
	if (personId != null && userInfo != null) {
		for (p in userInfo.persons) {
			if (userInfo.persons[p].id == personId) {
				return userInfo.persons[p];
			}
		}
	}
	return null;
}

// arg is an noun_type object retreived as one of command args
Envelopes.setCurrentPersonId = function(arg) {
	if (arg != null && arg.data) {
		Envelopes.setPrefValue(Envelopes.Prefs.PERSON, arg.data);
		//Envelopes.debug('setCurrentPersonId: ' + arg.data);
	}
}

// arg is an noun_type object retreived as one of command args
Envelopes.getCurrentAccountId = function(arg) {
	var accountId = null;
	if (arg != null && arg.data) {
		accountId = arg.data;
	}
	if (accountId == null) {
		accountId = Envelopes.getPrefValue(Envelopes.Prefs.ACCOUNT);
	}
	//Envelopes.debug('getCurrentAccountId: ' + accountId);
	return accountId;
}

// arg is an noun_type object retreived as one of command args
Envelopes.getCurrentAccount = function(arg) {
	var accountId = Envelopes.getCurrentAccountId(arg);
	var userInfo = Envelopes.getUserInfo();
	if (accountId != null && userInfo != null) {
		for (a in userInfo.accounts) {
			if (userInfo.accounts[a].id == accountId) {
				return userInfo.accounts[a];
			}
		}
	}
	return null;
}

// arg is an noun_type object retreived as one of command args
Envelopes.setCurrentAccountId = function(arg) {
	if (arg != null && arg.data) {
		Envelopes.setPrefValue(Envelopes.Prefs.ACCOUNT, arg.data);
		//Envelopes.debug('setCurrentAccountId: ' + arg.data);
	}
}

Envelopes.LOGIN_KEY = '4konverta.login';

// TODO: Handle multiple logins
// Currently only first loing name is used
// We can allow to store several logins and keep current login in preferences
Envelopes.setAuthInfo = function(username, password) {
	Envelopes.reset();
	var opts = {
		name: Envelopes.LOGIN_KEY,
		username: username,
		password: password
	};
	CmdUtils.savePassword(opts);
	return;
}

// CmdUtils does not have removeLogin method exposed, so accessing passwordManager directly
Envelopes.clearAuthInfo = function() {
	Envelopes.reset();
	try {
		// Get Login Manager 
		var passwordManager = Components.classes["@mozilla.org/login-manager;1"]
			.getService(Components.interfaces.nsILoginManager);

		// Find users for this extension 
		var logins = passwordManager.findLogins({}, 
			'chrome://ubiquity/content', 
			"UbiquityInformation" + Envelopes.LOGIN_KEY, 
			null);

		for (var i = 0; i < logins.length; i++) {
			//CmdUtils.log(logins[i]);
			passwordManager.removeLogin(logins[i]);
		}
	}
	catch(ex) {
		CmdUtils.log(ex);
		// This will only happen if there is no nsILoginManager component class
	}
	return;
}

Envelopes.getAuthInfo = function() {
	var logins = CmdUtils.retrieveLogins(Envelopes.LOGIN_KEY);
	//CmdUtils.log(logins);
	
	var auth = {
		name: null,
		password: null
	};
	if (logins && logins.length > 0) {
		auth.name = logins[0].username;
		auth.password = logins[0].password;
	}
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
		if (pblock != null) {
			pblock.innerHTML = '<h1>Login failed</h1>'
				+ 'Please check that you set correct login in <b>4k-login</b> command'
				+ ' and also verify if you can log in at '
				+ '<a href="https://www.4konverta.com/">https://www.4konverta.com/</a>';
		} else {
			displayMessage('4konverta: Login failed');
		}
	} else {
		if (pblock != null) {
			pblock.innerHTML = '<h1>Unknown error</h1>';
		} else {
			Envelopes.debug(req);
			Envelopes.debug(errorThrown);
			displayMessage('4konverta: AJAX request failed');
		}
	}
}

/**
 * Default handler for successful ajax requests. Renders XML document in preview window.
 */
Envelopes.renderXml = function(pblock, data, textStatus) {
	pblock.innerHTML = '<b>Preview not implemented, displaying raw data</b><hr/>'
		+ data.replace(/</g,'&lt;');
}

Envelopes.isAuthInfoAvailable = function (pblock) {
	var authInfo = Envelopes.getAuthInfo();
	if ( !Envelopes.isAuthInfoValid(authInfo) ) {
		var msg = _('Your username/password information is not set.'
			+' Please use <b>4k-login</b> command to set your username and password and try again.');
		if (pblock != null) {
			pblock.innerHTML = CmdUtils.renderTemplate(msg, {});
		}
		return false;
	} else {
		return true;
	}
}

Envelopes.sendAjaxRequest = function(async, pblock, resource, data, onSuccess, onError, doGET, cbData) {
	if ( !Envelopes.isAuthInfoAvailable(pblock) ) {
		return;
	}
	var authInfo = Envelopes.getAuthInfo();
	var reqType = 'POST';
	if (doGET) {
		reqType = 'GET';
	}
	Envelopes.debug2('Request type: ' + reqType);
	var url = CmdUtils.renderTemplate(Envelopes.getBaseURL() + resource, 
		{user: authInfo.name});
	Envelopes.debug2('Request URL: ' + url);
	
	//var msg = _('Loading information for user "<b>${user}</b>"...');
	//pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name});
	
	var successHandler = onSuccess || Envelopes.renderXml;
	var errorHandler = onError || Envelopes.handleAjaxError;
	
	jQuery.ajax({
		type: reqType,
		url: url,
		data: data,
		beforeSend: function(xhr) {
			Envelopes.setRequestHeaders(xhr, authInfo);
			//CmdUtils.log(this);
			return true;
		},
		success: function(data, textStatus) {
			Envelopes.debug2('Request successful: ' + url);
			successHandler.call(this, pblock, data, textStatus, cbData);
		},
		error: function(req, textStatus, errorThrown) {
			Envelopes.debug('Request error: ' + url);
			errorHandler.call(this, pblock, req, textStatus, errorThrown);
		}
	});
	
}

Envelopes.parseUserInfo = function (data) {
	var user = {_rawData: data};
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
				id: $(this).attr('id'),
				code: $(this).attr('code'),
				name: $(this).text()
			};
		});
		user.accounts.push(account);
	});
	return user;
}

Envelopes.parseDailyExpence = function (data) {
	var de = {_rawData: data, date: null, defaultAccount: null, sum: null, expressions: []};
	var $ = jQuery;
	var $de = $(data);

	de.date = $de.attr('date');
	de.defaultAccount = $de.attr('defaultAccount');
	de.sum = $de.find('sum').text();
	$de.find('expression').each(function() {
		var $expr = $(this);
		var expr = {
			account: $expr.attr('account'),
			currency: $expr.attr('currency'),
			value: $expr.text(),
			lines: $expr.text().replace(/\n/g, '<br/>')
		};
		de.expressions.push(expr);
	});
	//Envelopes.debug(de);
	return de;
}

Envelopes.handleUserInfo = function(pblock, data, textStatus) {
	var userInfo = Envelopes.parseUserInfo(data);
	//CmdUtils.log(userInfo);
	
	Envelopes.setUserInfo(userInfo);
	Envelopes.displayUserInfo(pblock, false);
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

Envelopes.displayUserInfo = function(pblock, loadMissing) {
	if ( !Envelopes.isAuthInfoAvailable(pblock) ) {
		return;
	}
	var authInfo = Envelopes.getAuthInfo();
	var userInfo = Envelopes.getUserInfo();
	if (userInfo != null) {
		var authInfo = Envelopes.getAuthInfo();
		if (pblock != null) {
			pblock.innerHTML = CmdUtils.renderTemplate(Envelopes.MSG_USER_INFO, {user: userInfo, auth: authInfo});
		}
	} else {
		if (loadMissing) {
			var msg = _('Loading information for user "<b>${user}</b>"...');
			pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name});
			Envelopes.sendAjaxRequest(true, pblock, Envelopes.API.USER_INFO, null, Envelopes.handleUserInfo, null);
		}
	}
}

Envelopes.handleUserInfoForDailyExpence = function(pblock, data, textStatus, cbData) {

	var userInfo = Envelopes.parseUserInfo(data);
	Envelopes.setUserInfo(userInfo);
	Envelopes.loadDailyExpences(pblock, cbData.args, false);
}

Envelopes.HTML_STYLES = ' \
<style type="text/css"> \
table { \
	border-spacing:0px; \
	border-width: 1px; \
	border-collapse: collapse; \
	border-style: solid none solid; \
	width: 100%; \
} \
td { \
	border-color: white; \
	border-width: 1px; \
	border-style: dotted none dotted; \
	vertical-align: top; \
} \
td.first-column { \
	text-align: right; \
	width: 20%; \
	font-weight: bold; \
	padding-right: 8px \
}\
tr.summary { \
	border-width: 1px; \
	border-style: solid none solid; \
	font-weight: bold; \
} \
.hint { \
	color: lightgrey; \
	font-size: x-small; \
} \
.error { \
	color: red; \
	font-weight: bold; \
} \
.h1 { \
	font-weight: bold; \
	font-size: larger; \
} \
</style> \
';

Envelopes.MACROS = ' \
{macro accountName(accountId, userInfo)} \
	{for a in userInfo.accounts} \
		{if a.id == accountId}${a.name}{/if} \
	{/for} \
{/macro} \
{macro accountCurrencyCode(accountId, userInfo)} \
	{for a in userInfo.accounts} \
		{if a.id == accountId}${a.currency.code}{/if} \
	{/for} \
{/macro} \
';

Envelopes.MSG_DAILY_EXPENSE_HEADER = Envelopes.HTML_STYLES + Envelopes.MACROS + 
'<div class="h1">Submit expence</div> \
<table>\
<tr><td class="first-column">Expression</td><td> \
	{if args.object.text.length > 0} \
		${args.object.text} \
		{if currency!=null} \
			<div class="hint">Using currency: ${currency.code}</div>\
		{/if}\
	{else}<div class="error">Please enter expression</div>{/if} \
	</td> \
</tr> \
<tr><td class="first-column">Account</td><td><b> \
	{if account != null} ${account.name}\
	{else}<div class="error">Please select account</div> \
	{/if}</b> \
		<div class="hint">Available accounts:&nbsp; \
		{for a in userInfo.accounts} \
			<b>${a.name} (${a.value})</b> \
			{if a != userInfo.accounts[userInfo.accounts.length-1]}, {/if} \
		{/for} \
		</div> \
	</td> \
</tr> \
<tr><td class="first-column">Person</td><td><b> \
	{if person != null} ${person.name}\
	{else}<div class="error">Please select person</div> \
	{/if}</b> \
		<div class="hint">Available persons:&nbsp; \
		{for p in userInfo.persons} \
			<b>${p.name}</b> \
			{if p != userInfo.persons[userInfo.persons.length-1]}, {/if} \
		{/for} \
		</div> \
	</td> \
</tr> \
<tr><td class="first-column">Date</td><td>${date}</td></tr> \
</table> \
&nbsp; \
<div> \
{if de && de != null} \
	<div class="h1">Reported expences</div> \
	<table> \
	<!--<thead><th>Account</th><th>Expence</th></thead>-->\
	{for e in de.expressions} \
		<tr> \
		<td class="first-column"> \
			${accountName(e.account,userInfo)} (${accountCurrencyCode(e.account,userInfo).trim()}) \
		</td>\
		<td>${e.lines}</td> \
		</tr>  \
	{/for}\
	<tr class="summary"><td class="first-column">Total</td><td>${de.sum}</td></tr>  \
	</table>\
{elseif rawData != null} \
	${rawData} \
{elseif inputValid} \
	Loading data... \
{else} \
	<div class="warning">Please enter all required parameters </div> \
{/if} \
</div>';

Envelopes.loadDailyExpences = function(pblock, args, loadUserInfo) {
	if ( !Envelopes.isAuthInfoAvailable(pblock) ) {
		return;
	}
	var authInfo = Envelopes.getAuthInfo();
	var acc = Envelopes.getCurrentAccount(args.source);
	var cbData = {
		args: args, 
		personId: Envelopes.getCurrentPersonId(args.alias), 
		person: Envelopes.getCurrentPerson(args.alias),
		account: acc,
		currency: acc != null ? acc.currency : null,
		date: args.time.text, 
		user: authInfo.name,
		userInfo: Envelopes.getUserInfo(),
		inputValid: false,
		de: null,
		rawData: null
	};

	if (cbData.userInfo == null && loadUserInfo) {
		pblock.innerHTML = CmdUtils.renderTemplate(_("Loading user information..."));
		Envelopes.sendAjaxRequest(true, pblock, Envelopes.API.USER_INFO, null, Envelopes.handleUserInfoForDailyExpence, null, 
			true, cbData);
		return;
	}
	if (cbData.person != null && cbData.date != null) {
		cbData.inputValid = true;
	}
	pblock.innerHTML = CmdUtils.renderTemplate(Envelopes.MSG_DAILY_EXPENSE_HEADER, cbData);
	
	if (cbData.inputValid) {
		var url = CmdUtils.renderTemplate(Envelopes.API.DAILY_EXPENSE, cbData);
		Envelopes.sendAjaxRequest(true, pblock, url, null, Envelopes.displayDailyExpences, null, true, cbData);
	}
}

Envelopes.displayDailyExpences = function(pblock, data, textStatus, cbData) {
	Envelopes.debug2(cbData);
	var de = Envelopes.parseDailyExpence(data);
	cbData.de = de;
	
	cbData.rawData = data.replace(/</g,'&lt;');
	pblock.innerHTML = CmdUtils.renderTemplate(Envelopes.MSG_DAILY_EXPENSE_HEADER, cbData);

	return;
}

Envelopes.prepareExpenceForSubmission = function(args) {
	if ( !Envelopes.isAuthInfoAvailable(null) ) {
		displayMessage(_('Error: You are not logged in'));
		return;
	}
	
	var authInfo = Envelopes.getAuthInfo();
	//var personId = Envelopes.getCurrentPersonId(args.alias); 
	var person = Envelopes.getCurrentPerson(args.alias);
	var account = Envelopes.getCurrentAccount(args.source);
	var currency = account != null ? account.currency : null;
	var date = args.time.text;
	var expr = args.object.text;
	
	var cbData = {
		args: args, 
		person: person,
		account: account,
		currency: currency,
		date: date,
		expression: expr,
		user: authInfo.name,
		userInfo: Envelopes.getUserInfo(),
		url: null
	};

	if (person != null && account != null && currency != null 
			&& expr.length > 0 && date.length > 0) {
		cbData.personId = person.id;
		cbData.url = CmdUtils.renderTemplate(Envelopes.API.DAILY_EXPENSE, cbData);
		Envelopes.sendAjaxRequest(true, null, cbData.url, null, 
			Envelopes.submitDailyExpence, 
			null,
			true,
			cbData
		);
		displayMessage("Saving expence...");
	} else {
		displayMessage("Not enough parameters");
	}

}


Envelopes.submitDailyExpence = function(pblock, data, textStatus, cbData) {
	var expr = '';
	var de = Envelopes.parseDailyExpence(data);
	for (e in de.expressions) {
		if (de.expressions[e].account == cbData.account.id) {
			expr = de.expressions[e].value + '\n';
			break;
		}
	}
	
	expr += cbData.expression;
	var data = {
		expression: expr,
		account: cbData.account.id,
		currency: cbData.currency.id
	};
	
	Envelopes.sendAjaxRequest(true, null, cbData.url, data, 
		function(pblock, data, textStatus) {
			displayMessage("Expense successfully saved!");
		}, 
		null,
		false
	);
}

noun_type_account = {
	label: "account",
	suggest: function(text, html, callback, selectionIndices) {
		var userInfo = Envelopes.getUserInfo();
		var accounts = userInfo!=null ? userInfo.accounts : [];
		var result = [];
		for (var i in accounts) {
			//CmdUtils.log(accounts[i]);
			if (accounts[i].name.match(text, "i")) {
				result.push(CmdUtils.makeSugg(accounts[i].name, null, accounts[i].id));
			}
		}
		return result;
	}
};

noun_type_person = {
	label: "person",
	suggest: function(text, html, callback, selectionIndices) {
		var userInfo = Envelopes.getUserInfo();
		var persons = userInfo!=null ? userInfo.persons : [];
		var result = [];
		for (var i in persons) {
			//CmdUtils.log(persons[i]);
			if (persons[i].name.match(text, "i")) {
				result.push(CmdUtils.makeSugg(persons[i].name, null, persons[i].id));
			}
		}
		return result;
	}
};

CmdUtils.CreateCommand({
	names: ["4k daily expense", "spent"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Submit daily expence",
	help: "",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	arguments: [{role: 'object', nountype: noun_arb_text, label: 'expression'},
				{role: 'source', nountype: noun_type_account, label: 'account'},
				{role: 'alias', nountype: noun_type_person, label: 'person'},
				{role: 'time', nountype: noun_type_date, label: 'date'}],

	preview: function preview(pblock, args) {
		Envelopes.loadDailyExpences(pblock, args, true);
	},
	execute: function execute(args) {
		//displayMessage("You selected: " + args.object.text, this);
		Envelopes.setCurrentPersonId(args.alias);
		Envelopes.setCurrentAccountId(args.source);
		Envelopes.prepareExpenceForSubmission(args);
	}
});

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
		Envelopes.displayUserInfo(pblock, true);
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

CmdUtils.CreateCommand({
	names: ["4k reset"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Reset internal caches",
	help: "Execute this command to reset internally cached infromation like infromation about user, accoutns, etc.",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	execute: function execute(args) {
		Envelopes.reset();
		displayMessage('4konverta Reset complete', this);
	}
});

