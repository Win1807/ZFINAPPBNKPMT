/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/core/Fragment", "sap/ui/Global", "zfin/ap/zapprovebankpayments/model/Messaging"], function (B,
	F, U, M) {
	"use strict";
	var f = {
		"": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitNoAuthDialog",
		"S": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitSmsDialog",
		"I": "zfin.ap.zapprovebankpayments.view.list.ConfirmSubmitAppDialog"
	};
	var _ = M;
	return B.extend("zfin.ap.zapprovebankpayments.controller.list.ConfirmSubmitDialog", {
		_resolve: null,
		_reject: null,
		constructor: function (v, a) {
			var s = f[a] || f[""];
			var b = v.createId("ConfirmSubmitDialog");
			this._oDialog = U.xmlfragment(b, s, this);
			this.codeInput = F.byId(b, "nameInput");
			this.i18n = v.getModel("@i18n").getResourceBundle();
			v.addDependent(this._oDialog);
			return new Promise(function (r, R) {
				this._resolve = r;
				this._reject = R;
				this._oDialog.open();
			}.bind(this));
		},
		onSubmitDialogOkPress: function () {
			var a = this.codeInput ? this.codeInput.getValue() : undefined;
			if (this.codeInput && !a) {
				this.codeInput.setValueStateText(this.i18n.getText("missingEntry"));
				this.codeInput.setValueState("Error");
				return;
			}
			this._oDialog.close();
			this._resolve(a);
		},
		onSubmitDialogCancelPress: function () {
			this._oDialog.close();
			this._reject();
		},
		onAfterSubmitClose: function () {
			this._oDialog.destroy();
		},
		sendSmsCode: function () {
			var m = this._oDialog.getModel();
			_.actionStarted(this.i18n.getText("confirmSubmitDialogTitle"));
			m.callFunction("/sendToken", {
				success: _.actionFinished.bind(null, this.i18n.getText("verificationSend")),
				error: function () {
					_.addActionError(this.i18n.getText("verificationNotSend"));
					_.actionFinished();
				}.bind(this),
				urlParameters: {
					Action: "'X'"
				},
				method: "POST"
			});
		}
	});
});