/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/model/formatter"], function (F) {
	"use strict";
	var _ = F;
	var a;
	var b = function (c) {
		if (!a && c) {
			c.getModel().read(c.getPath() + "/to_BankPaymentBatchRuleBaseCust", {
				success: function (d) {
					var e = d ? d.ResubmissionDays : undefined;
					if (e && !isNaN(parseFloat(e)) && isFinite(e)) {
						a = e;
					}
				}
			});
		}
	};
	return {
		checkDeferDaysPeriod: function (c) {
			b(c);
		},
		getDeferSettings: function () {
			var d = new Date();
			if (a) {
				d.setDate(d.getDate() + a);
			}
			return {
				date: _.dateTimeToDate(d),
				minDate: _.dateTimeToDate(new Date())
			};
		}
	};
});