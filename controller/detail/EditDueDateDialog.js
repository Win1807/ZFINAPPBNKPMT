/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/Global", "sap/ui/base/Object", "sap/ui/core/library", "sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
], function (U, B, l, J, F) {
	"use strict";
	var V = l.ValueState;
	var _ = F;
	var e = "zfin.ap.zapprovebankpayments.view.batch.EditDueDateDialog";
	return B.extend("zfin.ap.zapprovebankpayments.controller.detail.EditDueDateDialog", {
		_resolve: null,
		_reject: null,
		constructor: function (v, m) {
			this._oDialog = U.xmlfragment(v.createId("EditDueDateDialog"), e, this);
			v.addDependent(this._oDialog);
			this._oDialog.setModel(new J(m), "due");
			this._oDialog.getModel("due").setProperty("/isValidDate", true);
			return new Promise(function (r, R) {
				this._resolve = r;
				this._reject = R;
				this._oDialog.open();
			}.bind(this));
		},
		onDueDateInputChange: function (a) {
			var s = a.getSource();
			var v = a.getParameter("valid");
			var i = v && s.getDateValue() !== null;
			s.setValueState(i ? V.None : V.Error);
			this._oDialog.getModel("due").setProperty("/isValidDate", i);
		},
		onEditDueDateSubmit: function () {
			var m = this._oDialog.getModel("due");
			var d = _.dateTimeToDate(m.getProperty("/date"));
			this._oDialog.close();
			this._resolve(d);
		},
		onEditDueDateCancel: function () {
			this._oDialog.close();
			this._reject();
		},
		onAfterEditDueDateClose: function () {
			this._oDialog.destroy();
		}
	});
});