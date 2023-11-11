
use can_config_rs::config;

pub struct TypeFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    value: CompositeTypeValue,
    message_ref : config::MessageRef,
}

impl TypeFrame {
    pub fn new(id : u32, ide : bool, rtr : bool, dlc : u8, value : CompositeTypeValue, message_ref : config::MessageRef) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            value,
            message_ref,
        }
    }
}

pub struct FrameType {
    name: String,
    value : TypeValue,
}

pub enum TypeValue {
    Unsigned(u64),
    Signed(u64),
    Real(f64),
    Composite(CompositeTypeValue),
    Enum(String),
    Array(ArrayTypeValue),
}

pub struct CompositeTypeValue {
    attributes : Vec<FrameType>,
    //lookup : Arc<HashMap<String, usize>>,
}

pub struct ArrayTypeValue {
    size : usize,
    ty : Box<TypeValue>,
}
