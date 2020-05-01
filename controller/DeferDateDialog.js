/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/Global", "sap/ui/base/Object", "sap/ui/core/library", "sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter", "zfin/ap/zapprovebankpayments/model/deferAction"
], function (U, B, c, J, F, D) {
	"use strict";
	var V = c.ValueState;
	var _ = F;
	var a = D;
	var d = "zfin.ap.zapprovebankpayments.view.DeferDateDialog";
	return B.extend("zfin.ap.zapprovebankpayments.controller.DeferDateDialog", {
		_resolve: null,
		_reject: null,
		constructor: function (v) {
			this._oDialog = U.xmlfragment(v.createId("DeferDateDialog"), d, this);
			v.addDependent(this._oDialog);
			this._oDialog.setModel(new J(a.getDeferSettings()), "defer");
			this._oDialog.getModel("defer").setProperty("/isValidDate", true);
			return new Promise(function (r, R) {
				this._resolve = r;
				this._reject = R;
				this._oDialog.open();
			}.bind(this));
		},
		onDeferDateInputChange: function (e) {
			var s = e.getSource();
			var v = e.getParameter("valid");
			var i = v && s.getDateValue() !== null;
			s.setValueState(i ? V.None : V.Error);
			this._oDialog.getModel("defer").setProperty("/isValidDate", i);
		},
		onDeferDateDialogOkPress: function () {
			var m = this._oDialog.getModel("defer");
			var b = _.dateTimeToDate(m.getProperty("/date"));
			this._oDialog.close();
			this._resolve(b);
		},
		onDeferDateDialogCancelPress: function () {
			this._oDialog.close();
			this._reject();
		},
		onAfterDeferDateClose: function () {
			this._oDialog.destroy();
		}
	});
});