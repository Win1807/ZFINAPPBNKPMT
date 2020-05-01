/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/library"], function (c) {
	"use strict";
	var V = c.ValueState;
	var P = [{
		abbr: "N",
		flagState: V.None
	}, {
		abbr: "P",
		flagState: V.Warning
	}, {
		abbr: "A",
		flagState: V.Error
	}];
	return {
		PAYMENT_URGENT_FLAG_STATE: P
	};
});