use std::{collections::HashMap, cmp::Ordering};

use can_config_rs::config::{self, Type};

use crate::can::{
    can_frame::CanFrame,
    frame::{
        type_frame::{CompositeTypeValue, FrameType, TypeFrame, TypeValue},
        Frame,
    },
};

enum TypeParser {
    UnsignedParser {
        name: String,
        bit_offset: u32,
        bit_size: u32,
    },
    SignedParser {
        name: String,
        bit_offset: u32,
        bit_size: u32,
    },
    DecimalParser {
        name: String,
        bit_offset: u32,
        bit_size: u32,
        scale: f64,
        offset: f64,
    },
    CompositeParser {
        name: String,
        ty: config::TypeRef,
        attrib_parsers: Vec<TypeParser>,
    },
    RootParser {
        attrib_parsers: Vec<TypeParser>,
    },
    EnumParser {
        name : String,
        bit_offset : u32,
        bit_size : u32,
        ty : config::TypeRef,
        entries : Vec<(String, u64)>,
    },
    ArrayParser {},
}

impl TypeParser {
    pub fn new_root_parser(message_ref: &config::MessageRef) -> Self {
        let encoding = message_ref
            .encoding()
            .expect("Type Parser only work on messages with encodings");
        let mut attrib_parsers = vec![];
        for enc in config::MessageEncoding::attributes(&encoding) {
            match enc {
                config::TypeSignalEncoding::Composite(composite_encoding) => {
                    let name = composite_encoding.name();
                    let ty = composite_encoding.ty();
                    let attributes = composite_encoding.attributes();
                    attrib_parsers.push(TypeParser::new_composite_parser(name, ty, attributes));
                }
                config::TypeSignalEncoding::Primitive(primitive_encoding) => {
                    let name = primitive_encoding.name();
                    let signal = primitive_encoding.signal();
                    match primitive_encoding.ty() as &Type {
                        Type::Primitive(signal_type) => match signal_type {
                            config::SignalType::UnsignedInt { size } => {
                                attrib_parsers
                                    .push(TypeParser::new_unsigned_parser(name, signal, *size));
                            }
                            config::SignalType::SignedInt { size } => {
                                attrib_parsers
                                    .push(TypeParser::new_signed_parser(name, signal, *size));
                            }
                            config::SignalType::Decimal {
                                size,
                                offset,
                                scale,
                            } => {
                                attrib_parsers.push(TypeParser::new_decimal_parser(
                                    name, signal, *size, *offset, *scale,
                                ));
                            }
                        },
                        Type::Enum {
                            name,
                            description : _,
                            size,
                            entries,
                            visibility : _,
                        } => {
                            attrib_parsers.push(TypeParser::new_enum_parser(
                                    name, primitive_encoding.ty(), signal, *size, entries));
                        },
                        _ => panic!(),
                    }
                }
            }
        }
        Self::RootParser { attrib_parsers }
    }

    pub fn new_composite_parser(
        name: &str,
        ty: &config::TypeRef,
        attributes: &Vec<config::TypeSignalEncoding>,
    ) -> TypeParser {
        let mut composite_attrib_parsers = vec![];
        for attrib in attributes {
            match attrib {
                config::TypeSignalEncoding::Composite(composite_encoding) => {
                    let name = composite_encoding.name();
                    let ty = composite_encoding.ty();
                    let attributes = composite_encoding.attributes();
                    composite_attrib_parsers
                        .push(TypeParser::new_composite_parser(name, ty, attributes));
                }
                config::TypeSignalEncoding::Primitive(primitive_encoding) => {
                    let name = primitive_encoding.name();
                    let signal = primitive_encoding.signal();
                    match primitive_encoding.ty() as &Type {
                        Type::Primitive(signal_type) => match signal_type {
                            config::SignalType::UnsignedInt { size } => {
                                composite_attrib_parsers
                                    .push(TypeParser::new_unsigned_parser(name, signal, *size));
                            }
                            config::SignalType::SignedInt { size } => {
                                composite_attrib_parsers
                                    .push(TypeParser::new_signed_parser(name, signal, *size));
                            }
                            config::SignalType::Decimal {
                                size,
                                offset,
                                scale,
                            } => {
                                composite_attrib_parsers.push(TypeParser::new_decimal_parser(
                                    name, signal, *size, *offset, *scale,
                                ));
                            }
                        },
                        Type::Enum {
                            name,
                            description : _,
                            size,
                            entries,
                            visibility : _,
                        } => {
                            composite_attrib_parsers.push(TypeParser::new_enum_parser(
                                    name, primitive_encoding.ty(), signal, *size, entries));
                        },
                        _ => panic!(),
                    }
                }
            }
        }
        TypeParser::CompositeParser {
            name: name.to_owned(),
            ty: ty.clone(),
            attrib_parsers: composite_attrib_parsers,
        }
    }
    pub fn new_enum_parser(name: &str, ty: &config::TypeRef, signal_ref : &config::SignalRef, bit_size: u8, entries : &Vec<(String, u64)>) -> TypeParser {
        let mut entries = entries.clone();
        // sort by value
        entries.sort_by(|(_,a),(_,b)| {
            if a < b {
                return Ordering::Less;
            }else if a > b {
                return Ordering::Greater;
            }else {
                return Ordering::Equal;
            }
        });

        TypeParser::EnumParser {
            name: name.to_owned(),
            bit_offset: signal_ref.byte_offset() as u32,
            bit_size: bit_size as u32,
            ty : ty.clone(),
            entries : entries.clone(),
        }
    }


    pub fn new_unsigned_parser(name: &str, signal_ref: &config::SignalRef, size: u8) -> TypeParser {
        TypeParser::UnsignedParser {
            name: name.to_owned(),
            bit_offset: signal_ref.byte_offset() as u32,
            bit_size: size as u32,
        }
    }
    pub fn new_signed_parser(name: &str, signal_ref: &config::SignalRef, size: u8) -> TypeParser {
        TypeParser::SignedParser {
            name: name.to_owned(),
            bit_offset: signal_ref.byte_offset() as u32,
            bit_size: size as u32,
        }
    }
    pub fn new_decimal_parser(
        name: &str,
        signal_ref: &config::SignalRef,
        size: u8,
        offset: f64,
        scale: f64,
    ) -> TypeParser {
        TypeParser::DecimalParser {
            name: name.to_owned(),
            bit_offset: signal_ref.byte_offset() as u32,
            bit_size: size as u32,
            scale,
            offset,
        }
    }
    pub fn name(&self) -> &str {
        match &self {
            TypeParser::UnsignedParser {
                name,
                bit_offset: _,
                bit_size: _,
            } => name,
            TypeParser::SignedParser {
                name,
                bit_offset: _,
                bit_size: _,
            } => name,
            TypeParser::DecimalParser {
                name,
                bit_offset: _,
                bit_size: _,
                scale: _,
                offset: _,
            } => name,
            TypeParser::CompositeParser {
                name,
                ty: _,
                attrib_parsers: _,
            } => name,
            TypeParser::EnumParser { name, bit_offset, bit_size, ty, entries } => name,
            TypeParser::RootParser { attrib_parsers: _ } => {
                panic!("there is no name asociated with the root parser")
            }
            TypeParser::ArrayParser {} => todo!(),
        }
    }
}

impl TypeParser {
    pub fn parse(&self, data: u64) -> TypeValue {
        match &self {
            TypeParser::UnsignedParser {
                name: _,
                bit_offset,
                bit_size,
            } => {
                let value = data
                    .overflowing_shr(64 - bit_offset - bit_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - bit_size)
                    .0;

                TypeValue::Unsigned(value)
            }
            TypeParser::SignedParser {
                name: _,
                bit_offset,
                bit_size,
            } => {
                let value = data
                    .overflowing_shr(64 - bit_offset - bit_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - bit_size)
                    .0;

                let ivalue = unsafe { std::mem::transmute::<u64, i64>(value) };
                TypeValue::Signed(ivalue)
            }

            TypeParser::DecimalParser {
                name: _,
                bit_offset,
                bit_size,
                scale,
                offset,
            } => {
                let value = data
                    .overflowing_shr(64 - bit_offset - bit_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - bit_size)
                    .0;
                println!("data = {data}");
                println!("value = {value}");

                let dvalue = value as f64 * scale - offset;
                TypeValue::Real(dvalue)
            }
            TypeParser::CompositeParser {
                name: _,
                ty,
                attrib_parsers,
            } => {
                let attribs = attrib_parsers
                    .iter()
                    .map(|parser| FrameType::new(parser.name().to_owned(), parser.parse(data)))
                    .collect();
                TypeValue::Composite(CompositeTypeValue::new(attribs, ty))
            }
            TypeParser::RootParser { attrib_parsers } => {
                let attribs = attrib_parsers
                    .iter()
                    .map(|parser| FrameType::new(parser.name().to_owned(), parser.parse(data)))
                    .collect();
                TypeValue::Root(attribs)
            }
            TypeParser::EnumParser { name : _, bit_offset, bit_size, ty, entries } => {
                let value = data
                    .overflowing_shr(64 - bit_offset - bit_size)
                    .0 & 
                    (0xFFFFFFFFFFFFFFFF as u64).overflowing_shr(64 - bit_size)
                    .0;
                let opt = entries.iter().find(|e| e.1 == value);
                match opt {
                    Some((name, _)) => TypeValue::Enum(ty.clone(), name.clone()),
                    None => TypeValue::Enum(ty.clone(), "?".to_owned()),
                }
            }
            TypeParser::ArrayParser {} => todo!(),
        }
    }
}

pub struct TypeFrameParser {
    message_ref: config::MessageRef,
    root_parser: TypeParser,
}

impl TypeFrameParser {
    pub fn new(message_ref: &config::MessageRef) -> Self {
        Self {
            message_ref: message_ref.clone(),
            root_parser: TypeParser::new_root_parser(message_ref),
        }
    }

    pub fn parse(&self, frame: &CanFrame) -> Frame {
        let TypeValue::Root(composite_type_value) = self.root_parser.parse(frame.get_data_u64())
        else {
            panic!("root parser is not a CompositeParser");
        };
        Frame::TypeFrame(TypeFrame::new(
            frame.get_id(),
            frame.get_ide_flag(),
            frame.get_rtr_flag(),
            frame.get_dlc(),
            composite_type_value,
            self.message_ref.clone(),
        ))
    }
}
