/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
    "sap/base/Log",
	"sap/ui/core/library",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/MessageBox",
    "sap/m/MessageItem",
    "sap/m/MessageToast",
    "sap/m/MessageView",
    "sap/ui/core/message/Message"
	/* eslint-disable max-params */
], function(
	Log,
	coreLibrary,
    Button,
	Dialog,
	MessageBox,
	MessageItem,
	MessageToast,
	MessageView,
	Message
) {
    /* eslint-enable */
	"use strict";

	var MessageType = coreLibrary.MessageType;
	var _eventBus = sap.ui.getCore().getEventBus();
	var _eventChannelName = "zfin.ap.zapprovebankpayments";
	var _batchActionExecutionEventName = "onBatchActionExecutedEvent";
	var _paymentTableEditedEventName = "onPaymentTableEdited";
	var _paymentEditedEventName = "onPaymentEdited";
	var _resourceBundle;
	var _messageView;
	var _messageDialog;
	var _currentActionTitle;

	function _getMessageManager() {
		return sap.ui.getCore().getMessageManager();
	}

	function _getMessageModel() {
		return _getMessageManager().getMessageModel();
	}

	function _getProperty(oThing, sProperty) {
		var value = typeof oThing === "object" && oThing.hasOwnProperty(sProperty) ? oThing[sProperty] : null;
		return value ? value : null;
	}

	function _getInnerError(oError) {
		var innerError = null;
		var text = _getProperty(oError, "responseText");
		var wrapper = null;
		if (text) {
			try {
				wrapper = JSON.parse(text);
				innerError = wrapper.error;
			} catch (err) {
				innerError = null;
			}
		}

		return innerError;
	}

	function _descriptionFromResponseText(oError) {
		var innerError = _getInnerError(oError);
		return innerError && innerError.message ? innerError.message.value : null;
	}

	function _descriptionFromMessage(oError) {
		return _getProperty(oError, "message");
	}

	function _getErrorDescription(oError) {
		var description;
		var descriptionExtractors = [
			_descriptionFromResponseText,
			_descriptionFromMessage,
			function(anything) {
				return anything;
			}
		];
		var index;

		for (index = 0; index < descriptionExtractors.length; index++) {
			description = descriptionExtractors[index](oError);
			if (description) {
				break;
			}
		}

		return description;
	}

	function _getErrorDetails(oError) {
		var details;

		if (oError && oError.message) {
			details = oError.message + (oError.response ? "\r\n" + oError.response.body : "");
		} else {
			details = oError;
		}

		return details;
	}

	function _showSuccessMessage(sMessage) {
		MessageToast.show(sMessage);
	}

	function _showSingleMessage() {
		var error = _getMessageModel().getData()[0];
		MessageBox.error(error.message, {
			details: error.description
		});
	}

	function _getMessageView() {
		if (!_messageView) {
			_messageView = new MessageView({
				items: {
					path: "/",
					template: new MessageItem({
						type: "{type}",
						title: "{message}",
						description: "{description}"
					})
				}
			});

			_messageView.setModel(_getMessageModel());
		}

		return _messageView;
	}

	function _getMessageDialog() {
		if (!_messageDialog) {
			_messageDialog = new Dialog({
				resizable: true,
				content: _getMessageView(),
				state: "Error",
				beginButton: new Button({
					press: function() {
						this.getParent().close();
					},
					text: _resourceBundle.getText("dialogClose")
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});
		}

		_getMessageView().navigateBack();
		return _messageDialog;
	}

	function _showMultipleMessages(title) {
		var dialog = _getMessageDialog();
		dialog.setTitle(title);
		dialog.open();
	}

	return {
		eventName: {
			BATCH_ACTION: _batchActionExecutionEventName,
			PAYMENT_CHANGE: _paymentEditedEventName,
			PAYMENT_TABLE_CHANGE: _paymentTableEditedEventName
		},
		
		setReourceBundle: function(bundle) {
			_resourceBundle = bundle;
		},

		actionStarted: function(title) {
			_currentActionTitle = title;
			_getMessageManager().removeAllMessages();
		},

		addActionError: function(error) {
			this.addErrorMessage(_resourceBundle.getText("operationFailed", _currentActionTitle), error);
		},

		actionFinished: function(successMessage) {
			var errorCount = _getMessageModel().getData().length;
			if (errorCount > 1) {
				_showMultipleMessages(_currentActionTitle);
			} else if (errorCount === 1) {
				_showSingleMessage();
			} else if (successMessage) {
				_showSuccessMessage(successMessage);
			}
		},

		showSuccessMessage: function(sMessage) {
			_showSuccessMessage(sMessage);
		},

		/**
		 * Adds an UI error message
		 * @param {string} sMessage short text of message
		 * @param {string|any} oError longtext provided by backend - string or additional error information object from error handler
		 */
		addErrorMessage: function(sMessage, oError) {
			this.logError(sMessage, oError);
			_getMessageManager().addMessages(
				new Message({
					type: MessageType.Error,
					message: sMessage,
					description: _getErrorDescription(oError),
					processor: _getMessageModel()
				})
			);
		},

		/**
		 * Creates a new error-level entry in the log with the given message, details and calling component.
		 * @param {string} sMessage Message text to display
		 * @param {any} oError additional error information
		 * @param {string} sComponent Name of the component that produced the log entry
		 */
		logError: function(sMessage, oError, sComponent) {
			var message = sMessage ? sMessage : oError;
			var details = sMessage ? _getErrorDetails(oError) : undefined;
			Log.error(message, details, sComponent);
		},

		getBusinessLogicErrorCode: function(oError) {
			var innerError = _getInnerError(oError);
			return innerError ? innerError.code : null;
		},

		isMessageCentrumError: function(oError) {
			return !!this.getBusinessLogicErrorCode(oError);
		},

		publishEvent: function(eventName, oData) {
			_eventBus.publish(_eventChannelName, eventName, oData);
		},

		subscribeEvent: function(eventName, fnHandler, oContext) {
			_eventBus.subscribe(_eventChannelName, eventName, fnHandler, oContext);
		},
		
		unsubscribeEvent: function(eventName, fnHandler, oContext) {
			_eventBus.unsubscribe(_eventChannelName, eventName, fnHandler, oContext);
		}
	};
});