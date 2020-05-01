/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
    "sap/ui/core/library"
], function(coreLibrary) {
    "use strict";

	var ValueState = coreLibrary.ValueState;

	var PAYMENT_URGENT_FLAG_STATE = [{
        abbr: "N",
        flagState: ValueState.None
    }, {
        abbr: "P",
        flagState: ValueState.Warning
    }, {
        abbr: "A",
        flagState: ValueState.Error
    }];

	return {
        PAYMENT_URGENT_FLAG_STATE: PAYMENT_URGENT_FLAG_STATE
    };
});