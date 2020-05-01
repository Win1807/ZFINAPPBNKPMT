/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/ui/Global",
	"sap/ui/base/Object",
	"sap/ui/core/library",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/deferAction"
	/* eslint-disable max-params */
], function(UI, BaseObject, coreLibrary, JSONModel, Formatter, DeferAction) {
	/* eslint-enable */
	"use strict";

	var ValueState = coreLibrary.ValueState;
	var _formatter = Formatter;
	var _deferAction = DeferAction;
	var deferDateDialogFragment = "zfin.ap.zapprovebankpayments.view.DeferDateDialog";

	return BaseObject.extend("zfin.ap.zapprovebankpayments.controller.DeferDateDialog", {
		_resolve: null,
		_reject: null,

		constructor: function(oView) {
			this._oDialog = UI.xmlfragment(oView.createId("DeferDateDialog"), deferDateDialogFragment, this);
			oView.addDependent(this._oDialog);

			this._oDialog.setModel(new JSONModel(_deferAction.getDeferSettings()), "defer");
			this._oDialog.getModel("defer").setProperty("/isValidDate", true);

			return new Promise(function(fnResolve, fnReject) {
				this._resolve = fnResolve;
				this._reject = fnReject;
				this._oDialog.open();
			}.bind(this));
		},

		onDeferDateInputChange: function(event) {
			var source = event.getSource();
			var valid = event.getParameter("valid");
			var isValidDate = valid && source.getDateValue() !== null;
			source.setValueState(isValidDate ? ValueState.None : ValueState.Error);
			this._oDialog.getModel("defer").setProperty("/isValidDate", isValidDate);
		},

		onDeferDateDialogOkPress: function() {
			var oModel = this._oDialog.getModel("defer");
			var deferDate = _formatter.dateTimeToDate(oModel.getProperty("/date"));
			this._oDialog.close();
			this._resolve(deferDate);
		},

		onDeferDateDialogCancelPress: function() {
			this._oDialog.close();
			this._reject();
		},

		onAfterDeferDateClose: function() {
			this._oDialog.destroy();
		}
	});
});