/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/library"
], function(library) {
    "use strict";

	var ValueState = library.ValueState;
	var _aStatusGroups = [{
		resourceKey: "statusNew",
		status: ValueState.Success,
		values: ["IBC01"]
	}, {
		resourceKey: "statusInApproval",
		status: ValueState.Warning,
		values: ["IBC02"]
	}, {
		resourceKey: "statusApproved",
		status: ValueState.Success,
		values: ["IBC03", "IBC15"]
	}, {
		resourceKey: "statusSentToBank",
		status: ValueState.None,
		values: ["IBC04", "IBC05", "IBC06", "IBC07", "IBC08", "IBC17", "IBC22"]
	}, {
		resourceKey: "statusCompleted",
		status: ValueState.None,
		values: ["IBC11"]
	}, {
		resourceKey: "statusExceptions",
		status: ValueState.None,
		values: ["IBC12", "IBC13", "IBC14", "IBC16", "IBC18", "IBC19", "IBC20", "IBC21", "IBC23", "IBC24"]
	},
	{
		resourceKey: "statusRejected",
		status: ValueState.Error,
		values: ["IBC09"]
	},
	{
		resourceKey: "statusDefer",
		status: ValueState.Warning,
		values: ["IBC10"]
	},
	{
		resourceKey: "statusReturned",
		status: ValueState.Warning,
		values: ["IRTRN"]
	},
	{
		resourceKey: "taskApprove",
		status: ValueState.Success,
		values: ["app"]
	}, {
		resourceKey: "taskDefer",
		status: ValueState.Warning,
		values: ["def"]
	}, {
		resourceKey: "taskReject",
		status: ValueState.Error,
		values: ["rej"]
	}];

	var _fnGetGroupByPredicate = function(fnPredicate) {
		var oGroup;

		for (var i = 0; i < _aStatusGroups.length; i++) {
			oGroup = _aStatusGroups[i];
			if (fnPredicate(oGroup)) {
				return oGroup;
			}
		}

		return undefined;
	};

	return {
		getGroupByStatusValue: function(sValue) {
			return _fnGetGroupByPredicate(function(oGroup) {
				return oGroup.values.indexOf(sValue) !== -1;
			});
		},

		getGroupByKey: function(sKey) {
			return _fnGetGroupByPredicate(function(oGroup) {
				return oGroup.resourceKey === sKey;
			});
		}
	};
});