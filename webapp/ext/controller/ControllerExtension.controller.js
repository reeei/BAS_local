sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'sap/fe/templates/ListReport/ExtensionAPI',
	'sap/m/MessageToast',
	'sap/m/Dialog',
	'sap/ui/unified/FileUploader',
	'sap/ui/model/resource/ResourceModel',
	'sap/base/i18n/ResourceBundle',
	'sap/ui/core/Messaging',
	'sap/ui/core/message/Message',
	'sap/ui/core/message/MessageType',
	'sap/ui/model/odata/v4/ODataContextBinding',
	'sap/ui/core/Fragment',
	'sap/ui/core/util/File'
],
	
	function (ControllerExtension,ExtensionAPI,MessageToast,Dialog,FileUploader,ResourceModel,ResourceBundle,Messaging,Message,MessageType,ODataContextBinding,Fragment,uFile) {
	'use strict';
	var oDialog = new Dialog;
	var fileContent;
	var fileName;
	var fileType;
	var mimeType;
	var fileExtension;
	var namespace = "com.sap.gateway.srvd.z_ext_gl_posting.v0001."

	return ControllerExtension.extend('project1.ext.controller.ControllerExtension', {
		
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf project1.ext.controller.ControllerExtension
             */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				var oModel = this.base.getExtensionAPI().getModel();
			}
		},

		uploadFile: function(oEvent) {
			
			this.base.getExtensionAPI().loadFragment({
				name: "project1.ext.fragment.uploadFileDialog",
				type: "XML",
				controller: this
			/*
			}).then(function (oDialogResult) {
				oDialog = oDialogResult;
				oDialogResult.open();
			})
			*/
			}).then(function(oDialogResult) {
				//ダイアログがロードされたら
				oDialog = oDialogResult;
				oDialog.open();
			})

		},
		// On File Change
		onFileChange: function (oEvent) {
			// Read file
			var file = oEvent.getParameter("files")[0];
			if (file === undefined) {
				return;
			}
			fileType = file.type;  //mimetype or file type
			fileName = file.name;
			//Instantiate JavaScript FileReader API
			var fileReader = new FileReader();
			//Read file content using JavaScript FileReader API
			var readFile = function onReadFile(file) {
				return new Promise(function (resolve) {
					fileReader.onload = function (loadEvent) {
						resolve(loadEvent.target.result.match(/,(.*)$/)[1]);
						fileContent = loadEvent.target.result.match(/,(.*)$/)[1];
					};
					fileReader.readAsDataURL(file);
				});
			};
			this.base.getExtensionAPI().getEditFlow().securedExecution(() => readFile(file), {
				busy: { set: true }
			})
			/*
			new Action(readFile(file)).executeWithBusyIndicator().then(function (result) {
				fileContent = result;
			})
			*/

		},
		//perform upload
		onUploadPress: function (oEvent) {
			var oResourceBundle = this.base.getView().getModel("i18n").getResourceBundle();
			//check file has been entered
			if (fileContent === undefined || fileContent === "") {
				MessageToast.show(oResourceBundle.getText("uploadFileErrMsg"));
				return;
			}

			var oModel = this.base.getExtensionAPI().getModel();
			var oOperation = oModel.bindContext("/ZC_GeneralJournalEntry/" + namespace + "fileUpload(...)");

			var fnSuccess = function () {
				oModel.refresh();
				MessageToast.show(oResourceBundle.getText("uploadFileSuccMsg"));
				this.outputResultFile();
				oDialog.close();
				//Clear the file name from file uploader
				sap.ui.getCore().byId("idFileUpload").clear();
				oDialog.destroy();
				fileContent = undefined;
				
			}.bind(this);

			var fnError = function (oError) {
				this.base.editFlow.securedExecution(
					function () {
						Messaging.addMessages(
							new sap.ui.core.message.Message({
								message: oError.message,
								target: "",
								persistent: true,
								type: sap.ui.core.MessageType.Error,
								code: oError.error.code
							})
						);
						var aErrorDetail = oError.error.details;
						aErrorDetail.forEach((error) => {
							Messaging.addMessages(
								new sap.ui.core.message.Message({
									message: error.message,
									target: "",
									persistent: true,
									type: sap.ui.core.MessageType.Error,
									code: error.code
								})
							);
						})
					}
				);
				oDialog.close();
				//Clear the file name from file uploader
				sap.ui.getCore().byId("idFileUpload").clear();
				oDialog.destroy();
				fileContent = undefined;
			}.bind(this);

			oOperation.setParameter("mimeType", fileType);
			oOperation.setParameter("fileName", fileName);
			oOperation.setParameter("fileContent", fileContent);
			oOperation.setParameter("fileExtension", fileName.split(".")[1])
			//oOperation.setParameter("process", sProcess);
			oOperation.invoke().then(fnSuccess, fnError);
		},
		outputResultFile () {
			var oModel = this.base.getExtensionAPI().getModel(),
				oResourceBundle = this.base.getView().getModel("i18n").getResourceBundle();
			var oOperation = oModel.bindContext("/ZC_GeneralJournalEntry/" + namespace + "outputResult(...)");

			//Success function to display success messages from OData Operation
			var fnSuccess = function () {
				var oResults = oOperation.getBoundContext().getObject();

				var fixedFileContent = this.convertBase64(oResults.fileContent);

				var aUint8Array = Uint8Array.from(atob(fixedFileContent), c => c.charCodeAt(0)),
					oblob = new Blob([aUint8Array], { type: oResults.mimeType });

				uFile.save(oblob, oResults.fileName, oResults.fileExtension, oResults.mimeType);
				MessageToast.show(oResourceBundle.getText("downloadTempSuccMsg"));
			}.bind(this);

			//Error function to display error messages from OData Operation
			var fnError = function () {
				this.base.editFlow.securedExecution(
					function () {
						Messaging.addMessages(
							new sap.ui.core.message.Message({
								message: oError.message,
								target: "",
								persistent: true,
								type: sap.ui.core.MessageType.Error,
								code: oError.error.code
							})
						);
						var aErrorDetail = oError.error.details;
						aErrorDetail.forEach((error) => {
							Messaging.addMessages(
								new sap.ui.core.message.Message({
									message: error.message,
									target: "",
									persistent: true,
									type: sap.ui.core.MessageType.Error,
									code: error.code
								})
							);
						})
					}
				);
			}.bind(this);

			// Execute OData V4 operation i.e a static function 'downloadFile' to download the excel template
			oOperation.setParameter("mimeType", fileType);
			oOperation.setParameter("fileName", fileName);
			oOperation.setParameter("fileContent", fileContent);
			oOperation.setParameter("fileExtension", fileName.split(".")[1])
			// oOperation.execute().then(fnSuccess, fnError)
			oOperation.invoke().then(fnSuccess, fnError);
                        // From UI5 version 1.123.0 onwards use invoke function
			//oOperation.invoke().then(fnSuccess, fnError);
		},
		onCancelPress () {
			oDialog.close();
			oDialog.destroy()
			fileContent = undefined
		},
		onTempDownload: function (oEvent) {
			var oModel = this.base.getExtensionAPI().getModel(),
				oResourceBundle = this.base.getView().getModel("i18n").getResourceBundle();
			var oOperation = oModel.bindContext("/ZC_GeneralJournalEntry/" + namespace + "downloadFile(...)");

			//Success function to display success messages from OData Operation
			var fnSuccess = function () {
				var oResults = oOperation.getBoundContext().getObject();

				var fixedFileContent = this.convertBase64(oResults.fileContent);

				var aUint8Array = Uint8Array.from(atob(fixedFileContent), c => c.charCodeAt(0)),
					oblob = new Blob([aUint8Array], { type: oResults.mimeType });

				uFile.save(oblob, oResults.fileName, oResults.fileExtension, oResults.mimeType);
				MessageToast.show(oResourceBundle.getText("downloadTempSuccMsg"));
			}.bind(this);

			//Error function to display error messages from OData Operation
			var fnError = function () {
				this.base.editFlow.securedExecution(
					function () {
						Messaging.addMessages(
							new sap.ui.core.message.Message({
								message: oError.message,
								target: "",
								persistent: true,
								type: sap.ui.core.MessageType.Error,
								code: oError.error.code
							})
						);
						var aErrorDetail = oError.error.details;
						aErrorDetail.forEach((error) => {
							Messaging.addMessages(
								new sap.ui.core.message.Message({
									message: error.message,
									target: "",
									persistent: true,
									type: sap.ui.core.MessageType.Error,
									code: error.code
								})
							);
						})
					}
				);
			}.bind(this);

			// Execute OData V4 operation i.e a static function 'downloadFile' to download the excel template
			oOperation.execute().then(fnSuccess, fnError)
                        // From UI5 version 1.123.0 onwards use invoke function
			//oOperation.invoke().then(fnSuccess, fnError);
		},

		convertBase64(urlSafeBase64){
			var standardBase64 = urlSafeBase64.replace(/_/g, '/').replace(/-/g, '+');
			return standardBase64;
		}
	});
});
