use std::ops::Index;

use can_config_rs::config;


#[derive(Debug)]
pub struct TypeFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    value: Vec<FrameType>,
    message_ref : config::MessageRef,
}

impl TypeFrame {
    pub fn new(id : u32, ide : bool, rtr : bool, dlc : u8, value : Vec<FrameType>, message_ref : config::MessageRef) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            value,
            message_ref,
        }
    }
    pub fn id(&self) -> u32 {
        self.id
    }
    pub fn ide(&self) -> bool {
        self.ide
    }
    pub fn rtr(&self) -> bool {
        self.rtr
    }
    pub fn dlc(&self) -> u8 {
        self.dlc
    }
    pub fn value(&self) -> &Vec<FrameType> {
        &self.value
    }
    pub fn message(&self) -> &config::MessageRef {
        &self.message_ref
    }

}

#[derive(Clone, Debug)]
pub struct FrameType {
    name: String,
    value : TypeValue,
}

impl FrameType {
    pub fn new(name : String, value : TypeValue) -> Self{
        Self {
            name,
            value
        }
    }
    pub fn value(&self) -> &TypeValue {
        &self.value
    }
    pub fn name(&self) -> &str {
        &self.name
    }
}

#[derive(Clone, Debug)]
pub enum TypeValue {
    Unsigned(u64),
    Signed(i64),
    Real(f64),
    Composite(CompositeTypeValue),
    Root(Vec<FrameType>),
    Enum(config::TypeRef, String),
    Array(ArrayTypeValue),
}

#[derive(Clone, Debug)]
pub struct CompositeTypeValue {
    attributes : Vec<FrameType>,
    ty : config::TypeRef,
    //lookup : Arc<HashMap<String, usize>>,
}

impl CompositeTypeValue {
    pub fn new(attributes : Vec<FrameType>, ty : &config::TypeRef) -> Self{
        Self {
            attributes,
            ty : ty.clone(),
        }
    }
    pub fn attributes(&self) -> &Vec<FrameType> {
        &self.attributes
    }
    pub fn at(&self, index : &str) -> Option<&FrameType> {
        self.attributes.iter().find(|a| a.name() == index)
    }
}

impl Index<&str> for CompositeTypeValue {
    type Output = FrameType;

    fn index(&self, index: &str) -> &Self::Output {
        self.attributes.iter().find(|a| a.name() == index).unwrap()
    }
}

#[derive(Clone, Debug)]
pub struct ArrayTypeValue {
    values : Vec<TypeValue>,
}

impl ArrayTypeValue {
    pub fn new(values : Vec<TypeValue>) -> Self {
        Self {
            values,
        }
    }
    pub fn size(&self) -> usize {
        self.values.len()
    }
    pub fn at(&self, index : usize) -> Option<&TypeValue> {
        self.values.get(index)
    }
}

impl Index<usize> for ArrayTypeValue {
    type Output = TypeValue;

    fn index(&self, index: usize) -> &Self::Output {
        &self.values[index]
    }
}
