﻿import {Strings} from "../Strings";
import {PropertyDefinitionFlags} from "../Enumerations/PropertyDefinitionFlags";
import {ServiceValidationException} from "../Exceptions/ServiceValidationException";
import {ServiceVersionException} from "../Exceptions/ServiceVersionException";
import {ServiceRequestBase} from "./Requests/ServiceRequestBase";
import {BasePropertySet} from "../Enumerations/BasePropertySet";
import {BodyType} from "../Enumerations/BodyType";
import {ExchangeVersion} from "../Enumerations/ExchangeVersion";
import {XmlAttributeNames} from "../Core/XmlAttributeNames";
import {XmlElementNames} from "../Core/XmlElementNames";
import {XmlNamespace} from "../Enumerations/XmlNamespace";
import {ServiceObjectType} from "../Enumerations/ServiceObjectType";
import {EwsUtilities} from "./EwsUtilities";
import {EwsServiceXmlWriter} from "./EwsServiceXmlWriter";

import {PropertyDefinition} from "../PropertyDefinitions/PropertyDefinition";
import {PropertyDefinitionBase} from "../PropertyDefinitions/PropertyDefinitionBase";

import {LazyMember} from "./LazyMember";
import {EwsLogging} from "../Core/EwsLogging";
import {StringHelper} from "../ExtensionMethods";
import {Dictionary} from "../AltDictionary";

//todo: should be done except for debugger stops
export class PropertySet /*implements ISelfValidate*/ { //IEnumerable<PropertyDefinitionBase>
    //using DefaultPropertySetDictionary = LazyMember<System.Collections.Generic.Dictionary<BasePropertySet, string>>;

    static get DefaultPropertySetMap(): LazyMember<Dictionary<BasePropertySet, string>> { return this.defaultPropertySetMap; }
    static IdOnly: PropertySet = PropertySet.CreateReadonlyPropertySet(BasePropertySet.IdOnly);
    static FirstClassProperties: PropertySet = PropertySet.CreateReadonlyPropertySet(BasePropertySet.FirstClassProperties); // static readonly
    private static defaultPropertySetMap: LazyMember<Dictionary<BasePropertySet, string>> = new LazyMember<Dictionary<BasePropertySet, string>>(() => {
        var result: Dictionary<BasePropertySet, string> = new Dictionary<BasePropertySet, string>((bps) => BasePropertySet[bps]);
        result.Add(BasePropertySet.IdOnly, "IdOnly");
        result.Add(BasePropertySet.FirstClassProperties, "AllProperties");
        return result;
    });
    private basePropertySet: BasePropertySet;
    private additionalProperties: PropertyDefinitionBase[] = [];// System.Collections.Generic.List<PropertyDefinitionBase>;
    private requestedBodyType: BodyType;
    private requestedUniqueBodyType: BodyType;
    private requestedNormalizedBodyType: BodyType;
    private filterHtml: boolean;
    private convertHtmlCodePageToUTF8: boolean;
    private inlineImageUrlTemplate: string;
    private blockExternalImages: boolean;
    private addTargetToLinks: boolean;
    private isReadOnly: boolean;
    private maximumBodySize: number;

    get BasePropertySet(): BasePropertySet { return this.basePropertySet; }
    set BasePropertySet(value) { this.ThrowIfReadonly(); this.basePropertySet = value; }
    get RequestedBodyType(): BodyType { return this.requestedBodyType; }
    set RequestedBodyType(value) { this.ThrowIfReadonly(); this.requestedBodyType = value; }
    get RequestedUniqueBodyType(): BodyType { return this.requestedUniqueBodyType; }
    set RequestedUniqueBodyType(value) { this.ThrowIfReadonly(); this.requestedUniqueBodyType = value; }
    get RequestedNormalizedBodyType(): BodyType { return this.requestedNormalizedBodyType; }
    set RequestedNormalizedBodyType(value) { this.ThrowIfReadonly(); this.requestedNormalizedBodyType = value; }
    get Count(): number { return this.additionalProperties.length; }
    get FilterHtmlContent(): boolean { return this.filterHtml; } //todo - nullable properties implementations;
    set FilterHtmlContent(value) { this.ThrowIfReadonly(); this.filterHtml = value; }
    get ConvertHtmlCodePageToUTF8(): boolean { return this.convertHtmlCodePageToUTF8; }
    set ConvertHtmlCodePageToUTF8(value) { this.ThrowIfReadonly(); this.convertHtmlCodePageToUTF8 = value; }
    get InlineImageUrlTemplate(): string { return this.inlineImageUrlTemplate; }
    set InlineImageUrlTemplate(value) { this.ThrowIfReadonly(); this.inlineImageUrlTemplate = value; }
    get BlockExternalImages(): boolean { return this.blockExternalImages; }
    set BlockExternalImages(value) { this.ThrowIfReadonly(); this.blockExternalImages = value; }
    get AddBlankTargetToLinks(): boolean { return this.addTargetToLinks; }
    set AddBlankTargetToLinks(value) { this.ThrowIfReadonly(); this.addTargetToLinks = value; }
    get MaximumBodySize(): number { return this.maximumBodySize; }
    set MaximumBodySize(value) { this.ThrowIfReadonly(); this.maximumBodySize = value; }

    get_Item(index: number): PropertyDefinitionBase { return this.additionalProperties[index]; } //this[int]



    //constructor();
    //constructor(basePropertySet:BasePropertySet);
    //constructor(additionalProperties: PropertyDefinitionBase[]);
    constructor(basePropertySet: BasePropertySet = BasePropertySet.IdOnly, additionalProperties?: PropertyDefinitionBase[]) {
        this.basePropertySet = basePropertySet;
        if (additionalProperties) {
            this.additionalProperties.push.apply(this.additionalProperties, additionalProperties); //todo: addrange for array - http://typescript.codeplex.com/workitem/1422
        }
    }

    Add(property: PropertyDefinitionBase): void {
        this.ThrowIfReadonly();
        EwsUtilities.ValidateParam(property, "property");

        if (this.additionalProperties.indexOf(property) === -1) {
            this.additionalProperties.push(property);
        }
    }
    AddRange(properties: PropertyDefinitionBase[] /*System.Collections.Generic.IEnumerable<T>*/): void {
        this.ThrowIfReadonly();
        EwsUtilities.ValidateParamCollection(properties, "properties");

        for (var property of properties) {
            this.Add(property);
        }
    }
    Clear(): void {
        this.ThrowIfReadonly();
        this.additionalProperties.splice(0);
    }
    Contains(property: PropertyDefinitionBase): boolean { return this.additionalProperties.indexOf(property) !== -1; }

    static CreateReadonlyPropertySet(basePropertySet: BasePropertySet): PropertySet {
        var propertySet: PropertySet = new PropertySet(basePropertySet);
        propertySet.isReadOnly = true;
        return propertySet;
    }

    GetEnumerator(): any { throw new Error("PropertySet.ts - GetEnumerator : Not implemented."); }

    GetShapeName(serviceObjectType: ServiceObjectType): string {
        switch (serviceObjectType) {
            case ServiceObjectType.Item:
                return XmlElementNames.ItemShape;
            case ServiceObjectType.Folder:
                return XmlElementNames.FolderShape;
            case ServiceObjectType.Conversation:
                return XmlElementNames.ConversationShape;
            default:
                EwsLogging.Assert(
                    false,
                    "PropertySet.GetShapeName",
                    StringHelper.Format("An unexpected object type {0} for property shape. This code path should never be reached.", serviceObjectType));
                return StringHelper.Empty;
        }
    }
    InternalValidate(): void {
        for (var i = 0; i < this.additionalProperties.length; i++) {
            if (this.additionalProperties[i] == null) {
                throw new ServiceValidationException(StringHelper.Format(Strings.AdditionalPropertyIsNull, i));
            }
        }
    }
    Remove(property: PropertyDefinitionBase): boolean {
        this.ThrowIfReadonly();
        var index = this.additionalProperties.indexOf(property);
        return typeof (this.additionalProperties.splice(index)) !== undefined;// .Remove(property);
    }
    ThrowIfReadonly(): void {
        if (this.isReadOnly) {
            throw new Error(" PropertySet can not be modified");// System.NotSupportedException(Strings.PropertySetCannotBeModified);
        }
    }
    Validate(): void { //void ISelfValidate.Validate()
        this.InternalValidate();
    }
    ValidateForRequest(request: ServiceRequestBase, summaryPropertiesOnly: boolean): void {
        for (var propDefBase of this.additionalProperties) {
            //var propDefBase: PropertyDefinitionBase = propItem;
            var propertyDefinition = <PropertyDefinition>propDefBase;
            if (propertyDefinition instanceof PropertyDefinition/* != null*/) {
                if (propertyDefinition.Version > request.Service.RequestedServerVersion) {
                    throw new ServiceVersionException(
                        StringHelper.Format(
                            Strings.PropertyIncompatibleWithRequestVersion,
                            propertyDefinition.Name,
                            propertyDefinition.Version));
                }

                if (summaryPropertiesOnly && !propertyDefinition.HasFlag(PropertyDefinitionFlags.CanFind, request.Service.RequestedServerVersion)) {
                    throw new ServiceValidationException(
                        StringHelper.Format(
                            Strings.NonSummaryPropertyCannotBeUsed,
                            propertyDefinition.Name,
                            request.GetXmlElementName()));
                }
            }
        }

        if (this.FilterHtmlContent/*.HasValue*/) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2010) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "FilterHtmlContent",
                        ExchangeVersion.Exchange2010));
            }
        }

        if (this.ConvertHtmlCodePageToUTF8/*.HasValue*/) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2010_SP1) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "ConvertHtmlCodePageToUTF8",
                        ExchangeVersion.Exchange2010_SP1));
            }
        }

        if (!StringHelper.IsNullOrEmpty(this.InlineImageUrlTemplate)) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2013) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "InlineImageUrlTemplate",
                        ExchangeVersion.Exchange2013));
            }
        }

        if (this.BlockExternalImages/*.HasValue*/) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2013) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "BlockExternalImages",
                        ExchangeVersion.Exchange2013));
            }
        }

        if (this.AddBlankTargetToLinks/*.HasValue*/) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2013) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "AddTargetToLinks",
                        ExchangeVersion.Exchange2013));
            }
        }

        if (this.MaximumBodySize/*.HasValue*/) {
            if (request.Service.RequestedServerVersion < ExchangeVersion.Exchange2013) {
                throw new ServiceVersionException(
                    StringHelper.Format(
                        Strings.PropertyIncompatibleWithRequestVersion,
                        "MaximumBodySize",
                        ExchangeVersion.Exchange2013));
            }
        }
    }
    static WriteAdditionalPropertiesToXml(writer: EwsServiceXmlWriter, propertyDefinitions: PropertyDefinitionBase[]): void {
        writer.WriteStartElement(XmlNamespace.Types, XmlElementNames.AdditionalProperties);

        for (var propertyDefinition of propertyDefinitions) {
            propertyDefinition.WriteToXml(writer);
        }

        writer.WriteEndElement();
    }
    //WriteGetShapeToJson(jsonRequest: JsonObject, service: ExchangeService, serviceObjectType: ServiceObjectType): any { throw new Error("PropertySet.ts - WriteGetShapeToJson : Not implemented."); }
    WriteToXml(writer: EwsServiceXmlWriter, serviceObjectType: ServiceObjectType): void {
        var shapeElementName: string = this.GetShapeName(serviceObjectType);

        writer.WriteStartElement(XmlNamespace.Messages, shapeElementName);

        writer.WriteElementValue(
            XmlNamespace.Types,
            XmlElementNames.BaseShape,
            PropertySet.defaultPropertySetMap.Member.get(this.BasePropertySet));

        if (serviceObjectType == ServiceObjectType.Item) {
            if (this.RequestedBodyType/*.HasValue*/) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.BodyType,
                    this.RequestedBodyType/*.Value*/);
            }

            if (this.RequestedUniqueBodyType/*.HasValue*/) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.UniqueBodyType,
                    this.RequestedUniqueBodyType/*.Value*/);
            }

            if (this.RequestedNormalizedBodyType/*.HasValue*/) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.NormalizedBodyType,
                    this.RequestedNormalizedBodyType/*.Value*/);
            }

            if (this.FilterHtmlContent/*.HasValue*/) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.FilterHtmlContent,
                    this.FilterHtmlContent/*.Value*/);
            }

            if (this.ConvertHtmlCodePageToUTF8/*.HasValue*/ &&
                writer.Service.RequestedServerVersion >= ExchangeVersion.Exchange2010_SP1) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.ConvertHtmlCodePageToUTF8,
                    this.ConvertHtmlCodePageToUTF8/*.Value*/);
            }

            if (!StringHelper.IsNullOrEmpty(this.InlineImageUrlTemplate) &&
                writer.Service.RequestedServerVersion >= ExchangeVersion.Exchange2013) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.InlineImageUrlTemplate,
                    this.InlineImageUrlTemplate);
            }

            if (this.BlockExternalImages/*.HasValue*/ &&
                writer.Service.RequestedServerVersion >= ExchangeVersion.Exchange2013) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.BlockExternalImages,
                    this.BlockExternalImages/*.Value*/);
            }

            if (this.AddBlankTargetToLinks/*.HasValue*/ &&
                writer.Service.RequestedServerVersion >= ExchangeVersion.Exchange2013) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.AddBlankTargetToLinks,
                    this.AddBlankTargetToLinks/*.Value*/);
            }

            if (this.MaximumBodySize/*.HasValue*/ &&
                writer.Service.RequestedServerVersion >= ExchangeVersion.Exchange2013) {
                writer.WriteElementValue(
                    XmlNamespace.Types,
                    XmlElementNames.MaximumBodySize,
                    this.MaximumBodySize/*.Value*/);
            }
        }

        if (this.additionalProperties.length > 0) {
            PropertySet.WriteAdditionalPropertiesToXml(writer, this.additionalProperties);
        }

        writer.WriteEndElement(); // Item/FolderShape
    }
}
