/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/library"], function (l) {
	"use strict";
	var V = l.ValueState;
	var _ = [{
		resourceKey: "statusNew",
		status: V.Success,
		values: ["IBC01"]
	}, {
		resourceKey: "statusInApproval",
		status: V.Warning,
		values: ["IBC02"]
	}, {
		resourceKey: "statusApproved",
		status: V.Success,
		values: ["IBC03", "IBC15"]
	}, {
		resourceKey: "statusSentToBank",
		status: V.None,
		values: ["IBC04", "IBC05", "IBC06", "IBC07", "IBC08", "IBC17", "IBC22"]
	}, {
		resourceKey: "statusCompleted",
		status: V.None,
		values: ["IBC11"]
	}, {
		resourceKey: "statusExceptions",
		status: V.None,
		values: ["IBC12", "IBC13", "IBC14", "IBC16", "IBC18", "IBC19", "IBC20", "IBC21", "IBC23", "IBC24"]
	}, {
		resourceKey: "statusRejected",
		status: V.Error,
		values: ["IBC09"]
	}, {
		resourceKey: "statusDefer",
		status: V.Warning,
		values: ["IBC10"]
	}, {
		resourceKey: "statusReturned",
		status: V.Warning,
		values: ["IRTRN"]
	}, {
		resourceKey: "taskApprove",
		status: V.Success,
		values: ["app"]
	}, {
		resourceKey: "taskDefer",
		status: V.Warning,
		values: ["def"]
	}, {
		resourceKey: "taskReject",
		status: V.Error,
		values: ["rej"]
	}];
	var a = function (p) {
		var g;
		for (var i = 0; i < _.length; i++) {
			g = _[i];
			if (p(g)) {
				return g;
			}
		}
		return undefined;
	};
	return {
		getGroupByStatusValue: function (v) {
			return a(function (g) {
				return g.values.indexOf(v) !== -1;
			});
		},
		getGroupByKey: function (k) {
			return a(function (g) {
				return g.resourceKey === k;
			});
		}
	};
});