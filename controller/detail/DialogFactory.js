/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/controller/detail/batch/ConfirmBatchActionDialog",
	"zfin/ap/zapprovebankpayments/controller/ConfirmUndoDialog", "zfin/ap/zapprovebankpayments/controller/DeferDateDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/EditDueDateDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/EditInstructionKeyDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/batch/TakeOverDialog", "zfin/ap/zapprovebankpayments/model/deferAction"
], function (C, a, D, E, b, T, c) {
	"use strict";
	var _ = c;
	var d;
	return {
		askConfirmBatchAction: function (v, m, o, i) {
			var e = new C(v, m, o, i);
			return e.getPromise();
		},
		askConfirmUndo: function (v, e) {
			return new a(v, e);
		},
		askDeferDate: function (v) {
			return new D(v);
		},
		askEditDueDate: function (v, m) {
			return new E(v, m);
		},
		askEditInstructionKey: function (v, p) {
			if (d === undefined) {
				d = new b(v);
			}
			return d.selectInstructionKey(p);
		},
		askTakeOver: function (v, m) {
			return new T(v, m);
		},
		getDeferSettings: function () {
			return _.getDeferSettings();
		},
		checkDeferDaysPeriod: function (e) {
			_.checkDeferDaysPeriod(e);
		}
	};
});