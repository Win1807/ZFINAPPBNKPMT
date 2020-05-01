/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Global",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
	/* eslint-disable max-params */
], function(
	Parent,
	UI,
	Filter,
	FilterOperator,
	JSONModel,
	Formatters
) {
	/* eslint-enable */
	"use strict";

	var EDIT_INSTRUCTION_KEY_FRAGMENT = "zfin.ap.zapprovebankpayments.view.batch.EditInstructionKeyDialog";
	var _resolve;
	var _reject;

	return Parent.extend("zfin.ap.zapprovebankpayments.controller.detail.EditInstructionKeyDialog", {

		formatter: Formatters,

		/**
		 * Sets the selected instruction key.
		 * 
		 * @callback setInstructionKey
		 * @param {string} instructionKey instruction key
		 */

		/**
		 * Constructor for EditInstructionKey
		 *
		 * @param {sap.ui.core.mvc.View} oView - object with data and references of current view
		 *
		 * @return {void}
		 */
		constructor: function(oView) {
			this._oView = oView;
		},

		selectInstructionKey: function(aPayments) {
			return new Promise(function(fnResolve, fnReject) {
				var oContext = aPayments[0];
				var dialog = this._getEditInstructionKeyDialog();
				var table = this._getSmartTable();
				_resolve = fnResolve;
				_reject = fnReject;

				table.setTableBindingPath(oContext + "/to_InstructionKey");
				table.rebindTable();
				dialog.open();
			}.bind(this));
		},

		/**
		 * Closes the edit instruction key dialog
		 *
		 * @return {void}
		 */
		onEditInstructionKeyCancelPress: function() {
			this._getEditInstructionKeyDialog().close();
			_reject();
		},

		/**
		 * Confirm the edit of instruction key
		 *
		 * @return {void}
		 */
		onEditInstructionKeyOKPress: function() {
			var sKey = this._getInnerTable().getSelectedItem().getBindingContext().getProperty("DataExchangeInstruction");
			this._getEditInstructionKeyDialog().close();
			_resolve(sKey);
		},

		onSelectionChange: function() {
			this._setOkEnabled(this._isSomethingSelected());
		},

		onUpdateFinished: function(oEvent) {
			var count = oEvent.getParameter("total");
			var withCount = this._getItemsBinding().isLengthFinal();
			this._setOkEnabled(this._isSomethingSelected());
			this._setTitle(withCount, count);
		},

		onUpdateStarted: function() {
			this._setOkEnabled(false);
		},

		onFilterInstructionKeys: function(oEvent) {
			var query = oEvent.getParameter("query");
			var filters = [];
			if (query) {
				filters.push(new Filter({
					filters: [
						new Filter("DataExchangeInstrnAddlInfo", FilterOperator.Contains, query),
						new Filter("DataExchangeInstruction", FilterOperator.Contains, query)
					],
					and: false // OR operator
				}));
			}

			this._getItemsBinding().filter(filters);
		},

		/**
		 * Getter for the resource bundle
		 *
		 * @returns {sap.ui.model.resource.ResourceModel} - the resourceModel of the component
		 */
		_getResourceBundle: function() {
			return this._oView.getModel("@i18n").getResourceBundle();
		},

		_getSmartTable: function() {
			return this._oView.byId("instructionKeySmartTable");
		},

		_getInnerTable: function() {
			return this._oView.byId("editInstructionKeyTable");
		},

		_getItemsBinding: function() {
			return this._getInnerTable().getBinding("items");
		},

		_setViewModelProperty: function(sProperty, oValue) {
			this._getEditInstructionKeyDialog().getModel("viewModel").setProperty("/" + sProperty, oValue);
		},

		_setOkEnabled: function(bEnabled) {
			this._setViewModelProperty("ready", bEnabled);
		},

		_setTitle: function(withCount, count) {
			var title = this._getResourceBundle().getText(withCount ? "editInstructionKeysCount" : "editInstructionKeys", [count]);
			this._setViewModelProperty("title", title);
		},

		_isSomethingSelected: function() {
			return this._getInnerTable().getSelectedItems().length > 0;
		},

		/**
		 * Returns reference to dialog for editing instruction key
		 *
		 * @return {Object} - reference to edit dialog
		 */
		_getEditInstructionKeyDialog: function() {
			if (!this.editInstructionKeyDialog) {
				this.editInstructionKeyDialog = UI.xmlfragment(this._oView.getId(), EDIT_INSTRUCTION_KEY_FRAGMENT, this);
				this._oView.addDependent(this.editInstructionKeyDialog);
				this.editInstructionKeyDialog.setModel(new JSONModel({
					ready: false,
					title: this._getResourceBundle().getText("editInstructionKeys")
				}), "viewModel");
			}

			return this.editInstructionKeyDialog;
		}
	});
});