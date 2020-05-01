/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/statusGroups"
], function(
	Filter,
	JSONModel,
	StatusGroups
) {
	"use strict";

	var _constants = {
		viewModelName: "batchListView",
		urgentFilterKeys: "urgentFilterKeys",
		statusFilterKeys: "statusFilterKeys"
	};

	var _viewModel = new JSONModel({
		firstStageActionsAvailable: false,
		nextStageActionsAvailable: false,
		undoAvailable: false,
		statusFilterKeys: [],
		urgentFilterKeys: [],
		reviewedCount: "0",
		submitReviewedAllowed: false,
		submitReviewedText: ""
	});

	var _batchAllwaysRequestedFields = [
		"ApprovalIsFirst",
		"ApprovalIsFinal",
		"IsReturnedApproval",
		"IsUrgentPayment",
		"PaymentBatchIsEdited",
		"PaymentBatchIsProcessed",
		"Status",

		// for smartlink popovers
		"PaytBatchHasMoreHouseBanks",
		"PaytBatchHasMoreBankAccounts",
		"HouseBank",
		"HouseBankIBAN"
	].join(",");

	var _batchIgnoredFields = [
		"ApprovalIsFinal",
		"ApprovalIsFinalText",
		"IsUrgentPayment",
		"PaymentIsUrgentText",
		"Status"
	].join(",");

	var _oResourceBundle = null;

	function _getKeysFilter(sFilterField, aKeys) {
		var filter;
		var filters;
		if (sFilterField && aKeys && aKeys.length > 0) {
			filters = aKeys.map(function(key) {
				return new Filter(sFilterField, "EQ", key);
			});

			filter = filters.length === 1 ? filters[0] : new Filter(filters, false);
		}

		return filter;
	}

	function _getFilters() {
		var keys;
		var filters = [];
		var urgentKeys = _viewModel.getProperty("/" + _constants.urgentFilterKeys);
		var statusKeys = _viewModel.getProperty("/" + _constants.statusFilterKeys);

		if (urgentKeys && urgentKeys.length > 0) {
			filters.push(_getKeysFilter("IsUrgentPayment", urgentKeys));
		}

		if (statusKeys && statusKeys.length > 0) {
			keys = [].concat.apply([], statusKeys.map(function(key) {
				return StatusGroups.getGroupByKey(key).values;
			}));

			filters.push(_getKeysFilter("Status", keys));
		}

		return filters;
	}

	function _getRootMultiFilterIndex(filters) {
		var rootMultiFilter = filters.filter(function(f) {
			return !!f.aFilters;
		})[0];

		return rootMultiFilter ? filters.indexOf(rootMultiFilter) : -1;
	}

	function _setSubmitText() {
		var count = _viewModel.getProperty("/reviewedCount");
		var text = _oResourceBundle.getText("masterSubmitReviewedCount", count);
		_viewModel.setProperty("/submitReviewedText", text);
	}

	function _getSumaryinfo(selectedItems) {
		var items = selectedItems.map(function(row) {
			var context = row.getBindingContext();
			return {
				context: context,
				isNew: context.getProperty("ApprovalIsFirst") || context.getProperty("IsReturnedApproval")
			};
		});

		return {
			isSomeFirstStage: items.some(function(item) {
				return item.isNew;
			}),
			isSomeNextStage: items.some(function(item) {
				return !item.isNew;
			}),
			isSomePaymentEdit: items.some(function(item) {
				return item.context.getProperty("PaymentBatchIsEdited");
			}),
			isSomeUntouched: items.some(function(item) {
				return item.context.getProperty("IsActiveEntity");
			})
		};
	}

	return {
		getModel: function() {
			return _viewModel;
		},

		getModelName: function() {
			return _constants.viewModelName;
		},

		getAllwaysRequestFields: function() {
			return _batchAllwaysRequestedFields;
		},

		getIgnoredFields: function() {
			return _batchIgnoredFields;
		},

		init: function(bundle) {
			_oResourceBundle = bundle;
			_viewModel.setProperty("/firstStageActionsAvailable", false);
			_viewModel.setProperty("/nextStageActionsAvailable", false);
			_viewModel.setProperty("/undoAvailable", false);
			_viewModel.setProperty("/statusFilterKeys", []);
			_viewModel.setProperty("/urgentFilterKeys", []);
			_viewModel.setProperty("/reviewedCount", "0");
			_viewModel.setProperty("/submitReviewedAllowed", false);
			_viewModel.setProperty("/submitReviewedText", _oResourceBundle.getText("masterSubmitReviewed"));
		},

		onSelectionChanged: function(selectedItems) {
			var info = _getSumaryinfo(selectedItems);
			
			_viewModel.setProperty("/firstStageActionsAvailable", info.isSomeFirstStage && !info.isSomeNextStage && !info.isSomePaymentEdit);
			_viewModel.setProperty("/nextStageActionsAvailable", info.isSomeNextStage && !info.isSomeFirstStage && !info.isSomePaymentEdit);
			_viewModel.setProperty("/undoAvailable", selectedItems.length > 0 && !info.isSomeUntouched);
		},

		/**
		 * Adds custom filters to binding params.
		 * 
		 * When filter beeing added is MultiFilter, the it cannot be just pushed in filters
		 * because it would be combined with others via OR. It needs to be manually combined
		 * in multifilter (filter for editing status).
		 * 
		 * @param {any} oBindingParams binding parameters
		 */
		applyCustomFilters: function(oBindingParams) {
			var filters = _getFilters();
			var rootMultiIndex;
			var filter;
			var idx;

			for (idx = 0; idx < filters.length; idx++) {
				rootMultiIndex = _getRootMultiFilterIndex(oBindingParams.filters);
				filter = filters[idx];
				if (!filter.aFilters || rootMultiIndex === -1) {
					oBindingParams.filters.push(filter);
				} else if (oBindingParams.filters[rootMultiIndex].bAnd) {
					oBindingParams.filters[rootMultiIndex].aFilters.push(filter);
				} else {
					oBindingParams.filters[rootMultiIndex] = new Filter(
						[oBindingParams.filters[rootMultiIndex], filter],
						true);
				}
			}
		},

		saveCustomState: function(oCustomData) {
			var _saveProperty = function(name) {
				oCustomData[name] = _viewModel.getProperty("/" + name);
			};

			_saveProperty(_constants.urgentFilterKeys);
			_saveProperty(_constants.statusFilterKeys);
		},

		restoreCustomState: function(oCustomData) {
			var _restoreProperty = function(name) {
				if (oCustomData[name] !== undefined) {
					_viewModel.setProperty("/" + name, oCustomData[name]);
				}
			};

			_restoreProperty(_constants.urgentFilterKeys);
			_restoreProperty(_constants.statusFilterKeys);
		},

		getReviewedTabFilters: function() {
			return [
				new Filter("IsActiveEntity", "EQ", false),
				new Filter("PaymentBatchIsProcessed", "EQ", true)
			];
		},

		setReviewedCount: function(count) {
			_viewModel.setProperty("/reviewedCount", count);
			_viewModel.setProperty("/submitReviewedAllowed", count && count !== "0");
			_setSubmitText();
		}
	};
});
