/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/model/formatter"
], function(Formatter) {
	"use strict";

    var _formatter = Formatter;
	var _deferDaysPeriod;
	var _checkDeferDaysPeriod = function(context) {

		if (!_deferDaysPeriod && context) {
			context.getModel().read(context.getPath() + "/to_BankPaymentBatchRuleBaseCust", {
				success: function(oData) {
					var days = oData ? oData.ResubmissionDays : undefined;
					if (days && !isNaN(parseFloat(days)) && isFinite(days)) {
						_deferDaysPeriod = days;
					}
				}
			});
		}
	};

	return {
		checkDeferDaysPeriod: function(context) {
			_checkDeferDaysPeriod(context);
		},

		getDeferSettings: function() {
			var deferDate = new Date();
			if (_deferDaysPeriod) {
				deferDate.setDate(deferDate.getDate() + _deferDaysPeriod);
			}

			return {
				date: _formatter.dateTimeToDate(deferDate),
				minDate: _formatter.dateTimeToDate(new Date())
			};
		}
	};
});