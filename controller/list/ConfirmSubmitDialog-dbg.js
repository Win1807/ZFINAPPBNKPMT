/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/Fragment",
    "sap/ui/Global",
    "zfin/ap/zapprovebankpayments/model/Messaging"
], function(BaseObject, Fragment, UI, Messaging) {
	"use strict";

	var fragment = {
		"": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitNoAuthDialog",
		"S": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitSmsDialog",
		"I": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitAppDialog"
	};

	var _messaging = Messaging;

	return BaseObject.extend("zfin.ap.zapprovebankpayments.controller.list.ConfirmSubmitDialog", {
		_resolve: null,
		_reject: null,


		constructor: function(oView, authType) {
			var selectedFragment = fragment[authType] || fragment[""];
			var fragmentId = oView.createId("ConfirmSubmitDialog");
			this._oDialog = UI.xmlfragment(fragmentId, selectedFragment, this);
			this.codeInput = Fragment.byId(fragmentId, "nameInput");
			this.i18n = oView.getModel("@i18n").getResourceBundle();
			oView.addDependent(this._oDialog);

			return new Promise(function(fnResolve, fnReject) {
				this._resolve = fnResolve;
				this._reject = fnReject;
				this._oDialog.open();
			}.bind(this));
		},

		onSubmitDialogOkPress: function() {
			var authCode = this.codeInput ? this.codeInput.getValue() : undefined;
			if (this.codeInput && !authCode) {
				this.codeInput.setValueStateText(this.i18n.getText("missingEntry"));
				this.codeInput.setValueState("Error");
				return;
			}
			this._oDialog.close();
			this._resolve(authCode);
		},

		onSubmitDialogCancelPress: function() {
			this._oDialog.close();
			this._reject();
		},

		onAfterSubmitClose: function() {
			this._oDialog.destroy();
		},

		sendSmsCode: function() {
			var model = this._oDialog.getModel();
			_messaging.actionStarted(this.i18n.getText("confirmSubmitDialogTitle"));

			model.callFunction("/sendToken", {
				success: _messaging.actionFinished.bind(null, this.i18n.getText("verificationSend")),
				error: function() {
					_messaging.addActionError(this.i18n.getText("verificationNotSend"));
					_messaging.actionFinished();
				}.bind(this),
				urlParameters: {
					Action: "'X'"
				},
				method: "POST"
			});
		}
	});
});