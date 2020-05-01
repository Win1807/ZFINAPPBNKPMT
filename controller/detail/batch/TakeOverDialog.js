/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/Global", "sap/ui/model/json/JSONModel"], function (P, U, J) {
	"use strict";
	var t = "zfin.ap.zapprovebankpayments.view.batch.TakeOverDialog";
	return P.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.TakeOverDialog", {
		_resolve: null,
		_reject: null,
		constructor: function (v, m) {
			this._oDialog = U.xmlfragment(v.createId("TakeOverDialog"), t, this);
			m.message = v.getModel("@i18n").getResourceBundle().getText("takeOverDialogMessage", m.userName);
			v.addDependent(this._oDialog);
			this._oDialog.setModel(new J(m));
			return new Promise(function (r, R) {
				this._resolve = r;
				this._reject = R;
				this._oDialog.open();
			}.bind(this));
		},
		onTakeOverDialogOkPress: function () {
			this._oDialog.close();
			this._resolve();
		},
		onTakeOverDialogCancelPress: function () {
			this._oDialog.close();
			this._reject();
		},
		onAfterTakeOverClose: function () {
			this._oDialog.destroy();
		}
	});
});