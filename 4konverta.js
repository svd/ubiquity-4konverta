
Envelopes = {};

Envelopes.API_APP_ID = "Demo";
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

Envelopes.getPrefValue = function (name) {
	if (name == null) {
		return null;
	}
	if (Application.prefs.has(name)) {
		var value = Application.prefs.get(name);
		//displayMessage('pref value: ' + value.value);
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

CmdUtils.CreateCommand({
	names: ["4k-login"],
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
		
		pblock.innerHTML = this.help;
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
		displayMessage("You selected: " + args.object.text + " -> " + args.instrument.text, this);
	}
});

CmdUtils.CreateCommand({
	names: ["4k-user"],
	icon: "http://www.4konverta.com/favicon.ico",
	description: "Get user info from www.4konverta.com",
	help: "",
	author: {name: "Sviatoslav Sviridov", email: "sviridov@gmail.com"},
	license: "GPL",
	homepage: "http://github.com/svd/ubiquity-4konverta/",

	arguments: [{role: 'object', nountype: noun_arb_text}],

	preview: function preview(pblock, args) {
		var authInfo = Envelopes.getAuthInfo();
		if ( !Envelopes.isAuthInfoValid(authInfo) ) {
			var msg = _('Your username/password information is not set.'
				+' Please use <b>4k-login</b> command to set your username and password and try again.');
			pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name, url: url});
			return;
		}
		var url = 'https://www.4konverta.com/data/' + authInfo.name
		var msg = _('Loading information for user "<b>${user}</b>"...');
		pblock.innerHTML = CmdUtils.renderTemplate(msg, {user: authInfo.name, url: url});
		
		jQuery.ajax({
			type: 'POST',
			url: url,
			beforeSend: function(xhr) {
				xhr.setRequestHeader(Envelopes.Headers.APP_ID, Envelopes.API_APP_ID);
				xhr.setRequestHeader(Envelopes.Headers.AUTH, authInfo.password);
				xhr.setRequestHeader(Envelopes.Headers.VERSION, Envelopes.API_VERSION);
				return true;
			},
			success: function(data, textStatus) {
				pblock.innerHTML = data.replace(/</g,'&lt;');
			},
			error: function(req, textStatus, errorThrown) {
				if (req.status = 401) {
					pblock.innerHTML = '<h1>Login failed</h1>'
						+ 'Please check that you set correct login in <b>4k-login</b> command'
						+ ' and also verify if you can log in at '
						+ '<a href="https://www.4konverta.com/">https://www.4konverta.com/</a>';
				} else {
					pblock.innerHTML = '<h1>Unknown error</h1>';
				}
			}
		});
	},
	execute: function execute(args) {
		//displayMessage("You selected: " + args.object.text, this);
	}
});
