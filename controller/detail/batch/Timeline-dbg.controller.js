/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* global jQuery */
sap.ui.define([
	"sap/m/library",
	"sap/ui/Global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
	/* eslint-disable max-params */
], function(
	mobileLibrary,
	GlobalUI,
	BaseController,
	JSONModel,
	formatter
) {
	/* eslint-enable max-params */
	"use strict";

	var PlacementType = mobileLibrary.PlacementType;
	var _oApproverPopover;
	var _oApproverListPopover;

	function _getCustomValue(element, key) {
		return element.getCustomData().filter(function(c) {
				return c.getKey() === key;
			})
			.map(function(c) {
				return c.getValue();
			})[0];
	}

	function _loadFragment(oView, sId, sPath, oContext) {
		var fullPath = "zfin.ap.zapprovebankpayments.view." + sPath;
		var fragment = GlobalUI.xmlfragment(oView.createId(sId), fullPath, oContext);
		oView.addDependent(fragment);
		return fragment;
	}

	function _showApproverPopover(oSource, oView, oController, oApproverModel) {
		if (!_oApproverPopover) {
			_oApproverPopover = _loadFragment(oView, "approverQuickView", "batch.ApproverQuickView", oController);
		}

		_oApproverPopover.setModel(oApproverModel);
		_oApproverPopover.setPlacement(PlacementType.Auto);
		setTimeout(function() {
			_oApproverPopover.openBy(oSource);
		}, 0);
	}

	function _showApproverListPopover(oSource, oView, oController, oApproverListModel) {
		if (!_oApproverListPopover) {
			_oApproverListPopover = _loadFragment(oView, "approversPopover", "batch.ApproversPopover", oController);
		}

		_oApproverListPopover.setModel(oApproverListModel, "approvers");
		_oApproverListPopover.setPlacement(PlacementType.Auto);
		setTimeout(function() {
			_oApproverListPopover.openBy(oSource);
		}, 0);
	}

	var Ctrl = BaseController.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.Timeline", {
		formatter: formatter,
		constructor: function() {}
	});

	Ctrl.prototype.onExit = function() {
		[
			_oApproverPopover,
			_oApproverListPopover
		].forEach(function(item) {
			if (item) {
				item.destroy();
			}
		});

		_oApproverPopover = undefined;
		_oApproverListPopover = undefined;
	};

	Ctrl.prototype._getApproverModelFromTimeline = function(key) {
		var model = this.getOwnerComponent().getModel("batchView");
		return model.getProperty("/timeline")
			.filter(function(event) {
				return event.Action === key.Action &&
					event.Changed === key.Changed &&
					event.Usnam === key.Usnam;
			})
			.map(function(event) {
				return new JSONModel({
					FullName: event.NameText,
					Telephone: event.TelnrLong,
					Mobile: event.MobileLong,
					Email: event.SmtpAddr,
					CompanyName: event.Name1,
					CompanyAddress: event.ApproverAddress
				});
			})[0];
	};

	Ctrl.prototype.onTimelineUsernamePress = function(oEvent) {
		var oSource = oEvent.getSource();
		var key = {
			Action: _getCustomValue(oSource, "Action"),
			Changed: _getCustomValue(oSource, "Changed"),
			Usnam: _getCustomValue(oSource, "Usnam")
		};

		var approver = this._getApproverModelFromTimeline(key);

		if (approver) {
			_showApproverPopover(oSource, this.getView(), this, approver);
		}
	};

	Ctrl.prototype.onApproverPress = function(oEvent) {
		var oSource = oEvent.getSource();
		var details = _getCustomValue(oSource, "Details");
		var approvers = _getCustomValue(oSource, "Approvers");
		if (details) {
			_showApproverPopover(oSource, this.getView(), this, new JSONModel(details));
		} else if (approvers) {
			_showApproverListPopover(oSource, this.getView(), this, new JSONModel(approvers));
		}
	};

	return Ctrl;
}, true);