﻿import {ComplexProperty} from "./ComplexProperty";
import {EwsServiceXmlReader} from "../Core/EwsServiceXmlReader";
import {JsonObject} from "../Core/JsonObject";
import {ExchangeService} from "../Core/ExchangeService";
import {EwsServiceXmlWriter} from "../Core/EwsServiceXmlWriter";
import {XmlAttributeNames} from "../Core/XmlAttributeNames";
export class MimeContentBase extends ComplexProperty {
    private characterSet: string;
    private content: any[];//byte[]
    
    
    ReadAttributesFromXmlJsObject(reader: EwsServiceXmlReader): void {
        //this.characterSet = reader.ReadAttributeValue<string>(XmlAttributeNames.CharacterSet);
    }
    ReadTextValueFromXmlJsObject(reader: EwsServiceXmlReader): void {
        //this.content = System.Convert.FromBase64String(reader.ReadValue());
    }

    LoadFromJson(jsonProperty: JsonObject, service: ExchangeService): void {
        //            foreach (string key in jsonProperty.Keys)
        //            {
        //                switch (key)
        //                {
        //                    case XmlAttributeNames.CharacterSet:
        //                        this.characterSet = jsonProperty.ReadAsString(key);
        //                        break;
        //                    case JsonObject.JsonValueString:
        //                        this.content = jsonProperty.ReadAsBase64Content(key);
        //                        break;
        //                    default:
        //                        break;
        //                }
        //            }
    }
    WriteAttributesToXml(writer: EwsServiceXmlWriter): void {
        writer.WriteAttributeValue(XmlAttributeNames.CharacterSet, this.CharacterSet);
    }
    WriteElementsToXml(writer: EwsServiceXmlWriter): void {
        if (this.Content != null && this.Content.length > 0) {
            //writer.WriteBase64ElementValue(this.Content);
        }
    }
    InternalToJson(service: ExchangeService): any {
        //            JsonObject jsonProperty = new JsonObject();
        //
        //            jsonProperty.Add(XmlAttributeNames.ChangeKey, this.CharacterSet);
        //
        //            if (this.Content != null && this.Content.Length > 0)
        //            {
        //                jsonProperty.AddBase64(JsonObject.JsonValueString, this.Content);
        //            }
        //
        //            return jsonProperty;
    }

    CharacterSet: string;
    //        {
    //            get { return this.characterSet; }
    //            set { this.SetFieldValue<string>(ref this.characterSet, value); }
    //        }

    Content: any[];//byte[]
    //        {
    //            get { return this.content; }
    //            set { this.SetFieldValue<byte[]>(ref this.content, value); }
    //        }
}


