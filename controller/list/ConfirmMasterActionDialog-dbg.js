/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Global",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
], function(BaseObject, UI, JSONModel, formatter) {
	"use strict";

	var confirmActionDialogFragment = "zfin.ap.zapprovebankpayments.view.list.ConfirmActionDialog";
	var _formatter = formatter;

	function _createViewModel(oModel, oResourceBundle, aBindings) {
		var oActionDetails = {
			"app": ["masterSelectedBatchesApprove", "Success"],
			"def": ["masterSelectedBatchesDefer", "Warning"],
			"rej": ["masterSelectedBatchesReject", "Error"],
			"ret": ["masterSelectedBatchesReturn", "Warning"]
		};

		var detail = oActionDetails[oModel.action];
		var totalCount = aBindings.length;
		var allUnsaved = aBindings.filter(function(batchContext) {
			return batchContext.getProperty("IsActiveEntity") &&
				batchContext.getProperty("HasDraftEntity");
		}).map(function(batchContext) {
			return batchContext.getProperty("DraftAdministrativeData/InProcessByUser");
		});

		var lockedCount = allUnsaved.filter(function(user) {
			return user;
		}).length;

		oModel.actionTitle = oResourceBundle.getText(detail[0]);
		oModel.actionStatus = detail[1];
		oModel.title = oResourceBundle.getText("userConfirmDialogBatchTitle", [oModel.actionTitle]);
		oModel.hasLocked = lockedCount > 0;
		oModel.lockMessage = oResourceBundle.getText("confirmDialogLockMessage", [lockedCount, totalCount]);
		oModel.unsavedCount = allUnsaved.length - lockedCount;
		oModel.hasUnsaved = oModel.unsavedCount > 0;
		oModel.unsavedMessage = oResourceBundle.getText("confirmDialogUnsavedMessage", [oModel.unsavedCount, totalCount]);
		oModel.freeCount = totalCount - allUnsaved.length;
		oModel.readyCount = oModel.freeCount;
		oModel.takeOver = false;

		return new JSONModel(oModel);
	}

	function _recomputeIsReady(model) {
		var enabled = model.getProperty("/readyCount") > 0 && (!model.getProperty("/isReject") || !!model.getProperty("/note"));
		if (model.getProperty("/enabled") !== enabled) {
			model.setProperty("/enabled", enabled);
		}
	}

	function _recomputeTakeOver(model) {
		var isTakeOver = model.getProperty("/takeOver");
		var ready = model.getProperty("/freeCount") + (isTakeOver ? model.getProperty("/unsavedCount") : 0);
		model.setProperty("/readyCount", ready);
		_recomputeIsReady(model);
	}

	var _propChangeHandlers = {
		"/takeOver": _recomputeTakeOver,
		"/note": _recomputeIsReady
	};

	return BaseObject.extend("zfin.ap.zapprovebankpayments.controller.list.ConfirmMasterActionDialog", {
		_resolve: null,
		_reject: null,

		constructor: function(oView, oModel, aBindings) {
			this._viewModel = _createViewModel(oModel, oView.getModel("@i18n").getResourceBundle(), aBindings);
			_recomputeIsReady(this._viewModel);
			this._viewModel.attachPropertyChange(null, this._viewModelPropertyChanged, this);

			this._oDialog = UI.xmlfragment(oView.createId("ConfirmMasterActionDialog"), confirmActionDialogFragment, this);
			oView.addDependent(this._oDialog);
			this._oDialog.setModel(this._viewModel, "action");

			return new Promise(function(fnResolve, fnReject) {
				this._resolve = fnResolve;
				this._reject = fnReject;
				this._oDialog.open();
			}.bind(this));
		},

		numberOfBatches: function(number) {
			return _formatter.numberOfBatches(number);
		},

		onConfirmMasterDialogOkPress: function() {
			var model = this._oDialog.getModel("action");
			var actionContext = {
				action: model.getProperty("/action"),
				note: model.getProperty("/note"),
				isDefer: model.getProperty("/isDefer"),
				deferDate: _formatter.dateTimeToDate(model.getProperty("/deferDate")),
				takeOver: model.getProperty("/takeOver")
			};

			this._oDialog.close();
			this._resolve(actionContext);
		},

		onConfirmMasterDialogCancelPress: function() {
			this._oDialog.close();
			this._reject();
		},

		onAfterConfirmMasterClose: function() {
			this._viewModel.detachPropertyChange(this._viewModelPropertyChanged, this);
			this._oDialog.destroy();
		},

		_viewModelPropertyChanged: function(oEvent) {
			var params = oEvent.getParameters();
			if (params &&
				params.reason === "binding" &&
				_propChangeHandlers[params.path]) {
				_propChangeHandlers[params.path](this._viewModel);
			}
		}
	});
});