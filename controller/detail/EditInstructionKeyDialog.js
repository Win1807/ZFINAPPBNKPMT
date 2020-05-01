/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/Global", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
], function (P, U, F, a, J, b) {
	"use strict";
	var E = "zfin.ap.zapprovebankpayments.view.batch.EditInstructionKeyDialog";
	var _;
	var c;
	return P.extend("zfin.ap.zapprovebankpayments.controller.detail.EditInstructionKeyDialog", {
		formatter: b,
		constructor: function (v) {
			this._oView = v;
		},
		selectInstructionKey: function (p) {
			return new Promise(function (r, R) {
				var C = p[0];
				var d = this._getEditInstructionKeyDialog();
				var t = this._getSmartTable();
				_ = r;
				c = R;
				t.setTableBindingPath(C + "/to_InstructionKey");
				t.rebindTable();
				d.open();
			}.bind(this));
		},
		onEditInstructionKeyCancelPress: function () {
			this._getEditInstructionKeyDialog().close();
			c();
		},
		onEditInstructionKeyOKPress: function () {
			var k = this._getInnerTable().getSelectedItem().getBindingContext().getProperty("DataExchangeInstruction");
			this._getEditInstructionKeyDialog().close();
			_(k);
		},
		onSelectionChange: function () {
			this._setOkEnabled(this._isSomethingSelected());
		},
		onUpdateFinished: function (e) {
			var d = e.getParameter("total");
			var w = this._getItemsBinding().isLengthFinal();
			this._setOkEnabled(this._isSomethingSelected());
			this._setTitle(w, d);
		},
		onUpdateStarted: function () {
			this._setOkEnabled(false);
		},
		onFilterInstructionKeys: function (e) {
			var q = e.getParameter("query");
			var f = [];
			if (q) {
				f.push(new F({
					filters: [new F("DataExchangeInstrnAddlInfo", a.Contains, q), new F("DataExchangeInstruction", a.Contains, q)],
					and: false
				}));
			}
			this._getItemsBinding().filter(f);
		},
		_getResourceBundle: function () {
			return this._oView.getModel("@i18n").getResourceBundle();
		},
		_getSmartTable: function () {
			return this._oView.byId("instructionKeySmartTable");
		},
		_getInnerTable: function () {
			return this._oView.byId("editInstructionKeyTable");
		},
		_getItemsBinding: function () {
			return this._getInnerTable().getBinding("items");
		},
		_setViewModelProperty: function (p, v) {
			this._getEditInstructionKeyDialog().getModel("viewModel").setProperty("/" + p, v);
		},
		_setOkEnabled: function (e) {
			this._setViewModelProperty("ready", e);
		},
		_setTitle: function (w, d) {
			var t = this._getResourceBundle().getText(w ? "editInstructionKeysCount" : "editInstructionKeys", [d]);
			this._setViewModelProperty("title", t);
		},
		_isSomethingSelected: function () {
			return this._getInnerTable().getSelectedItems().length > 0;
		},
		_getEditInstructionKeyDialog: function () {
			if (!this.editInstructionKeyDialog) {
				this.editInstructionKeyDialog = U.xmlfragment(this._oView.getId(), E, this);
				this._oView.addDependent(this.editInstructionKeyDialog);
				this.editInstructionKeyDialog.setModel(new J({
					ready: false,
					title: this._getResourceBundle().getText("editInstructionKeys")
				}), "viewModel");
			}
			return this.editInstructionKeyDialog;
		}
	});
});