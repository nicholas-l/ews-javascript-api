﻿import {ExchangeService} from "../ExchangeService";
import {Strings} from "../../Strings";
import {ServiceError} from "../../Enumerations/ServiceError";
import {ServiceResult} from "../../Enumerations/ServiceResult";
import {XmlNamespace} from "../../Enumerations/XmlNamespace";

import {PropertyDefinitionBase} from "../../PropertyDefinitions/PropertyDefinitionBase";
import {IndexedPropertyDefinition} from "../../PropertyDefinitions/IndexedPropertyDefinition";
import {ExtendedPropertyDefinition} from "../../PropertyDefinitions/ExtendedPropertyDefinition";

import {SoapFaultDetails} from "../../Misc/SoapFaultDetails";

import {ServiceResponseException} from "../../Exceptions/ServiceResponseException";

import {EwsServiceXmlReader} from "../EwsServiceXmlReader";
import {XmlElementNames} from "../XmlElementNames";
import {XmlAttributeNames} from "../XmlAttributeNames";
import {ServiceObjectSchema} from "../ServiceObjects/Schemas/ServiceObjectSchema";
export class ServiceResponse {
    get BatchProcessingStopped(): boolean { return (this.result == ServiceResult.Warning) && (this.errorCode == ServiceError.ErrorBatchProcessingStopped);} 
    get Result(): ServiceResult { return this.result; }
    get ErrorCode(): ServiceError { return this.errorCode; }
    ErrorMessage: string;
    get ErrorDetails(): { [index: string]: string; } /*System.Collections.Generic.IDictionary<string, string>*/ { return this.errorDetails; }
    get ErrorProperties() { return this.errorProperties; }//System.Collections.ObjectModel.Collection<PropertyDefinitionBase>;
    private result: ServiceResult;
    private errorCode: ServiceError;
    //private errorMessage: string;
    private errorDetails: { [index: string]: string; } = {}; /*System.Collections.Generic.Dictionary<string, string>*/
    private errorProperties: PropertyDefinitionBase[] = [];// System.Collections.ObjectModel.Collection<PropertyDefinitionBase>;
    /**
     * Initializes a new instance of the @see {@link ServiceResponse} class.
     * @constructor
     */
    constructor();
    /**
     * Initializes a new instance of the <see cref="ServiceResponse"/> class.
     * @constructor
     * @param {SoapFaultDetails} soapFaultDetails The SOAP fault details.
     */
    constructor(soapFaultDetails: SoapFaultDetails);
    /**
     * Initializes a new instance of the <see cref="ServiceResponse"/> class.
     * This is intended to be used by unit tests to create a fake service error response
     * @constructor
     * @param {ServiceError} responseCode Response code
     * @param {string} errorMessage Detailed error message
     */
    constructor(responseCode: ServiceError, errorMessage: string);

    constructor(soapFaultDetailsOrResponseCode?: SoapFaultDetails | ServiceError, errorMessage?: string) {
        var argsLength = arguments.length;
        if (argsLength == 0) return;

        if (typeof soapFaultDetailsOrResponseCode === 'number') {//(responseCode: ServiceError, errorMessage: string)
            this.result = ServiceResult.Error;
            this.errorCode = soapFaultDetailsOrResponseCode;
            this.ErrorMessage = errorMessage;
            this.errorDetails = null;
        }
        else {//(soapFaultDetails: SoapFaultDetails)
            this.result = ServiceResult.Error;
            this.errorCode = soapFaultDetailsOrResponseCode.ResponseCode;
            this.ErrorMessage = soapFaultDetailsOrResponseCode.FaultString;
            this.errorDetails = soapFaultDetailsOrResponseCode.ErrorDetails;
        }
    }

    InternalThrowIfNecessary(): void {
        if (this.Result == ServiceResult.Error) {
            throw new ServiceResponseException(this);
        }
    }
    Loaded(): void { /* virtual void to be implemented throw new Error("Not implemented.");*/ }
    LoadExtraErrorDetailsFromXml(reader: EwsServiceXmlReader, xmlElementName: string): boolean {
        if (reader.IsElement(XmlNamespace.Messages, XmlElementNames.MessageXml) && !reader.IsEmptyElement) {
            this.ParseMessageXml(reader);

            return true;
        }
        else {
            return false;
        }
    }
    LoadFromXmlJsObject(responseObject: any, service: ExchangeService): any {

        this.result = <any>ServiceResult[responseObject[XmlAttributeNames.ResponseClass]];
        this.errorCode = <any>ServiceError[responseObject[XmlElementNames.ResponseCode]];
            
        // TODO: Deal with a JSON version of "LoadExtraDetailsFromXml"
        if (this.result == ServiceResult.Warning || this.result == ServiceResult.Error) {
            this.ErrorMessage = responseObject[XmlElementNames.MessageText];
        }

        if (this.result == ServiceResult.Success || this.result == ServiceResult.Warning) {
            if (!this.BatchProcessingStopped) {
                this.ReadElementsFromXmlJsObject(responseObject, service);
            }
        }

        this.MapErrorCodeToErrorMessage();

        this.Loaded();

    }
    
    MapErrorCodeToErrorMessage(): void {
        // Use a better error message when an item cannot be updated because its changeKey is old.
        if (this.ErrorCode == ServiceError.ErrorIrresolvableConflict) {
            this.ErrorMessage = Strings.ItemIsOutOfDate;
        }
    }
    ParseMessageXml(reader: EwsServiceXmlReader): void {
        throw new Error("ServiceResponse.ts - ParseMessageXml - not used")
        do {
            //debugger;
            reader.Read();

            //if (reader.IsStartElement()) {
            switch (reader.LocalName) {
                case XmlElementNames.Value:
                    this.errorDetails[reader.ReadAttributeValue(null, XmlAttributeNames.Name)] = reader.ReadElementValue();
                    break;

                case XmlElementNames.FieldURI:
                   // debugger;//next statement needs implementation or varification of accuracy
                    //this.errorProperties.push(ServiceObjectSchema.FindPropertyDefinition(reader.ReadAttributeValue(null, XmlAttributeNames.FieldURI)));
                    break;

                case XmlElementNames.IndexedFieldURI:
                    this.errorProperties.push(
                        new IndexedPropertyDefinition(
                            reader.ReadAttributeValue(null, XmlAttributeNames.FieldURI),
                            reader.ReadAttributeValue(null, XmlAttributeNames.FieldIndex)));
                    break;

                case XmlElementNames.ExtendedFieldURI:
                    var extendedPropDef = new ExtendedPropertyDefinition();
                    //debugger;//next statement may be inaccurate
                    extendedPropDef.LoadPropertyValueFromXmlJsObject(reader);
                    this.errorProperties.push(extendedPropDef);
                    break;

                default:
                    break;
            }
            //}
        }
        while (!reader.HasRecursiveParent(/*XmlNamespace.Messages,*/ XmlElementNames.MessageXml));
        reader.SeekLast();
    }
    ReadElementsFromJson(responseObject: any /*JsonObject*/, service: ExchangeService): void {
        //virtual void
    }
    ReadElementsFromXmlJsObject(jsObject: any, service: ExchangeService): void { /* virtualvoid to be implemented throw new Error("Not implemented.");*/ }
    ThrowIfNecessary(): void { this.InternalThrowIfNecessary(); }
}