import { Box, Button, Modal, Paper, Stack, Typography } from "@mui/material";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation";
import { useEffect, useState } from "react";
import { EnumTypeInfo, IntTypeInfo, RealTypeInfo, StructTypeInfo, Type, UIntTypeInfo } from "../types/Type";
import UnsignedPropertyInputField from "./UnsignedPropertyInputField";
import SignedPropertyInputField from "./SignedPropertyInputField";
import RealPropertyInputField from "./RealPropertyInputField";
import EnumPropertyInputField from "./EnumPropertyInputField";
import { invoke } from "@tauri-apps/api";
import { Value } from "../types/Value";
import { ObjectEntryListenLatestResponse } from "../types/events/ObjectEntryListenLatestResponse";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../types/events/ObjectEntryEvent";


type OptionalValue = number | string | { [name: string]: OptionalValue } | null | undefined;

type SetterLambda = (setter: ((old: OptionalValue) => OptionalValue)) => void;

function isValidValue(ty: Type, value: OptionalValue): boolean {
  switch (ty.id) {
    case "uint": case "int": case "real": case "enum":
      return value !== null;
    case "struct":
      if (value === null) return false;
      if (value == undefined) return true;
      const structInfo = ty.info as StructTypeInfo;
      const valueAsStruct = value as { [name: string]: OptionalValue };
      for (const [attrib_name, attrib_type] of Object.entries(structInfo.attributes)) {
        if (!isValidValue(attrib_type, valueAsStruct[attrib_name])) {
          return false;
        }
      }
      return true;
  }
}

function sendSetRequest(nodeName: string, objectEntryName: string, value: OptionalValue, currentValue: Value | undefined, ty: Type) {

  // NOTE: construct a new value, where all undefined attributes 
  // are replaced with the currentValue to 
  function autocompleteRec(value: OptionalValue, currentValue: Value | undefined, ty: Type): Value | null {
    if (value == null)return null;
    switch (ty.id) {
      case "uint": case "int": case "real": case "enum":
        return (value ?? currentValue) as Value ?? null;
      case "struct":
        if (value === undefined) {
          return currentValue ?? null;
        } else {
          const structInfo = ty.info as StructTypeInfo;
          const valueAsStruct = value as { [name: string]: OptionalValue };
          const currentValueAsStruct = value as { [name: string]: Value };
          const autocompletedStruct: { [name: string]: Value } | null = {};
          for (const [attrib_name, attrib_type] of Object.entries(structInfo.attributes)) {
            const auto =
              autocompleteRec(valueAsStruct[attrib_name], currentValueAsStruct[attrib_name], attrib_type);
            if (!auto) {
              return null;
            }
            autocompletedStruct[attrib_name] = auto;
          }
          return autocompletedStruct;
        }


    }
  }

  let autocompletedValue: Value | null = autocompleteRec(value, currentValue, ty);
  if (!autocompletedValue) {
    // TODO error notification here please!
    // there doesn't exist a current value and not all values where specified, 
    // therefor the set request was aborted
    return;
  }
  console.log("sending set_request to backend:", autocompletedValue);

  invoke("set_object_entry_value", {
    nodeName,
    objectEntryName,
    newValueJson: JSON.stringify(autocompletedValue),
  }).catch((_) => {
    // TODO: send a error notification!
    console.error("TODO make be a notification");
  });
}


const dialogStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};


interface EditDialogProps {
  open: boolean,
  onClose: () => void,
  nodeName: string,
  objectEntryInfo: ObjectEntryInformation,
}


function EditDialog({ open, onClose, nodeName, objectEntryInfo }: EditDialogProps) {

  // NOTE: listeners to current values
  const [currentValue, setCurrentValue] = useState<Value | undefined>();

  useEffect(() => {
    async function registerLatestListeners() {
      const response = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
        { nodeName, objectEntryName: objectEntryInfo.name });
      setCurrentValue(response.latest?.value);
      let unlistenJs = await listen<ObjectEntryEvent>(response.event_name, event => {
        setCurrentValue(event.payload.value);
      });
      return () => {
        unlistenJs();
        invoke("unlisten_from_latest_object_entry_value",
          { nodeName, objectEntryName: objectEntryInfo.name }).catch(console.error);
      };
    }
    const unlisten = registerLatestListeners();
    return () => {
      unlisten.then(f => f()).catch(console.error);
    };
  }, [nodeName, objectEntryInfo]);

  const [value, setValue] = useState<OptionalValue>(undefined);

  const [propertyInputFields, setPropertyInputFields] = useState<JSX.Element[]>([]);
  useEffect(() => {
    const inputFields: JSX.Element[] = [];

    function recBuildInputFields(ty: Type, onUpdate: SetterLambda, value?: Value) {
      switch (ty.id) {
        case "uint": {
          const typeInfo = ty.info as UIntTypeInfo;
          const bitSize = typeInfo.bit_size;
          const max = Math.pow(2, bitSize) - 1; // NOTE might have some minor rounding errors.
          inputFields.push(<UnsignedPropertyInputField
            min={0}
            max={max}
            currentValue={value as number}
            // assert that onUpdate will by of type (number | string | null) => void.
            onUpdate={(value) => {
              onUpdate(_ => {
                return value
              });
            }} />);
          break;
        }
        case "int": {
          const typeInfo = ty.info as IntTypeInfo;
          const bitSize = typeInfo.bit_size;
          const max = Math.pow(2, bitSize - 1) - 1; // NOTE might have some minor rounding errors.
          const min = -Math.pow(2, bitSize - 1); // NOTE might have some minor rounding errors.
          inputFields.push(<SignedPropertyInputField
            min={min}
            max={max}
            currentValue={value as number}
            // assert that onUpdate will by of type (number | string | null) => void.
            onUpdate={value => {
              onUpdate(_ => {
                return value;
              });
            }} />);
          break;
        }
        case "real": {
          const typeInfo = ty.info as RealTypeInfo;
          inputFields.push(<RealPropertyInputField
            min={typeInfo.min}
            max={typeInfo.max}
            currentValue={value as number}
            // assert that onUpdate will by of type (number | string | null) => void.
            onUpdate={value => {
              onUpdate(_ => {
                return value;
              });
            }}
          />);
          break;
        }
        case "enum": {
          const typeInfo = ty.info as EnumTypeInfo;
          inputFields.push(<EnumPropertyInputField
            variants={typeInfo.variants}
            // assert that onUpdate will by of type (number | string | null) => void.
            currentValue={value as string}
            onUpdate={value => {
              onUpdate(_ => {
                return value;
              });
            }} />);
          break;
        }
        case "struct": {
          const typeInfo = ty.info as StructTypeInfo;
          for (const [attrib_name, attrib_type] of Object.entries(typeInfo.attributes)) {
            // NOTE: pretty cool functional stuff.
            // creates a lambda, which will provide a setter for the attribute
            // returning the value returned from the setter will be writen to the attribute
            // (for recursion the first parameter of the setter is the previous value)
            // same thing as setState(prev => {...prev}) in React.
            const attribOnUpdate: SetterLambda = (setter) => {
              onUpdate(old => {
                const asStruct = (old ?? {}) as { [name: string]: OptionalValue };
                asStruct[attrib_name] = setter(asStruct[attrib_name]);
                // check if all attributes of the new value are undefined
                let allUndefined = true;
                for (const x of Object.values(asStruct)) {
                  if (x !== undefined) {
                    allUndefined = false;
                  }
                }
                return allUndefined ? undefined : asStruct;
              });
            }
            if (currentValue === undefined) {
              recBuildInputFields(attrib_type, attribOnUpdate, undefined);
            } else {
              const currentValueAsStruct = currentValue as { [name: string]: Value };
              recBuildInputFields(attrib_type, attribOnUpdate, currentValueAsStruct[attrib_name]);
            }
          }
          break;
        }
      }
    }
    const rootSetter: SetterLambda = (setter) => {
      setValue(old => {
        let copy: OptionalValue;
        if (objectEntryInfo.ty.id == "struct") {
          const asStruct = (old ?? {}) as { [name: string]: OptionalValue };
          copy = { ...asStruct }; // copy struct
        } else {
          copy = old; // primitive can just be copied.
        }
        const newValue = setter(copy);
        return newValue;
      });
    }
    recBuildInputFields(objectEntryInfo.ty, rootSetter, currentValue);
    setPropertyInputFields(inputFields);
  }, [nodeName, objectEntryInfo.name, currentValue]);

  useEffect(() => {
    setValue(undefined);
  }, [open]);

  const enableUpload = isValidValue(objectEntryInfo.ty, value);

  return <Modal
    open={open}
    onClose={onClose}>
    <Paper sx={{ ...dialogStyle }}>
      <Stack direction="column" spacing={2} ml={2} mr={2}>
        <Stack direction="row" sx={{
          position: "relative",
          left: "-20px",
        }}>
          <Typography fontWeight={20} sx={{ marginRight: "8px" }}>
            <strong>Edit:</strong>
          </Typography>
          <Typography>
            {`${objectEntryInfo.name} of ${nodeName}`}
          </Typography>
        </Stack>
        {propertyInputFields}
        <Box component="form"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="outlined"
            sx={{
              marginLeft: "auto",
            }}
            // TODO: proper error message maybe red box
            color={enableUpload ? "primary" : "error"}
            disabled={!enableUpload}
            onClick={() => {
              // NOTE: assert that the value is valid! (otherwise the button is not enabled!)
              sendSetRequest(nodeName, objectEntryInfo.name, value, currentValue, objectEntryInfo.ty);
            }}
          >
            Upload
          </Button>
        </Box>
      </Stack>
    </Paper>
  </Modal>

}

export default EditDialog;
