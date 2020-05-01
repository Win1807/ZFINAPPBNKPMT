/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/ui/Global",
	"sap/ui/base/Object",
	"sap/ui/core/library",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
	/* eslint-disable max-params */
], function(UI, BaseObject, library, JSONModel, Formatter) {
    /* eslint-enable */
	"use strict";

	var ValueState = library.ValueState;
	var _formatter = Formatter;
	var editDueDateDialogFragment = "zfin.ap.zapprovebankpayments.view.batch.EditDueDateDialog";

	return BaseObject.extend("zfin.ap.zapprovebankpayments.controller.detail.EditDueDateDialog", {
		_resolve: null,
		_reject: null,

		constructor: function(oView, oModel) {
			this._oDialog = UI.xmlfragment(oView.createId("EditDueDateDialog"), editDueDateDialogFragment, this);
			oView.addDependent(this._oDialog);

			this._oDialog.setModel(new JSONModel(oModel), "due");
            this._oDialog.getModel("due").setProperty("/isValidDate", true);

			return new Promise(function(fnResolve, fnReject) {
				this._resolve = fnResolve;
				this._reject = fnReject;
				this._oDialog.open();
			}.bind(this));
		},

        onDueDateInputChange: function(event) {
			var source = event.getSource();
			var valid = event.getParameter("valid");
            var isValidDate = valid && source.getDateValue() !== null;
            source.setValueState(isValidDate ? ValueState.None : ValueState.Error);
            this._oDialog.getModel("due").setProperty("/isValidDate", isValidDate);
		},

		onEditDueDateSubmit: function() {
            var oModel = this._oDialog.getModel("due");
			var dueDate = _formatter.dateTimeToDate(oModel.getProperty("/date"));
			this._oDialog.close();
			this._resolve(dueDate);
		},

		onEditDueDateCancel: function() {
			this._oDialog.close();
			this._reject();
		},

		onAfterEditDueDateClose: function() {
			this._oDialog.destroy();
		}
	});
});