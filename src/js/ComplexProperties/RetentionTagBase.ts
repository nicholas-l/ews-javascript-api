﻿import {ComplexProperty} from "./ComplexProperty";
import {ExchangeService} from "../Core/ExchangeService";
import {EwsServiceXmlReader} from "../Core/EwsServiceXmlReader";
import {EwsServiceXmlWriter} from "../Core/EwsServiceXmlWriter";
export class RetentionTagBase extends ComplexProperty {
        IsExplicit: boolean;
        RetentionId: string /*System.Guid*/;
        private xmlElementName: string;
        private isExplicit: boolean;
        private retentionId: string /*System.Guid*/;
        InternalToJson(service: ExchangeService): any { throw new Error("RetentionTagBase.ts - InternalToJson : Not implemented."); }
        LoadFromJson(jsonProperty: any/*JsonObject*/, service: ExchangeService): any { throw new Error("RetentionTagBase.ts - LoadFromJson : Not implemented."); }
        ReadAttributesFromXmlJsObject(reader: EwsServiceXmlReader): any { throw new Error("RetentionTagBase.ts - ReadAttributesFromXml : Not implemented."); }
        ReadTextValueFromXmlJsObject(reader: EwsServiceXmlReader): any { throw new Error("RetentionTagBase.ts - ReadTextValueFromXml : Not implemented."); }
        ToString(): string { throw new Error("RetentionTagBase.ts - ToString : Not implemented."); }
        WriteAttributesToXml(writer: EwsServiceXmlWriter): any { throw new Error("RetentionTagBase.ts - WriteAttributesToXml : Not implemented."); }
        WriteElementsToXml(writer: EwsServiceXmlWriter): any { throw new Error("RetentionTagBase.ts - WriteElementsToXml : Not implemented."); }
    }


//}



