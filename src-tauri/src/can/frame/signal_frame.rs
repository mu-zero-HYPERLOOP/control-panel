use can_config_rs::config;

pub struct SignalFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    signals: Vec<Signal>,
    message_ref: config::MessageRef,
}

impl SignalFrame {
    pub fn new(
        id: u32,
        ide: bool,
        rtr: bool,
        dlc: u8,
        signals: Vec<Signal>,
        message_ref: config::MessageRef,
    ) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            signals,
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
    pub fn signals(&self) -> &Vec<Signal> {
        &self.signals
    }
    pub fn into_signals(self) -> Vec<Signal> {
        self.signals
    }
    pub fn name(&self) -> &str {
        self.message_ref.name()
    }
    pub fn description(&self) -> Option<&str> {
        self.message_ref.description()
    }

}

pub struct Signal {
    signal_ref: config::SignalRef,
    value: SignalValue,
}

impl Signal {
    pub fn new(signal_ref : config::SignalRef,  value : SignalValue) -> Self {
        Self {
            signal_ref,
            value
        }
    }
    pub fn name(&self) -> &str {
        self.signal_ref.name()
    }
    pub fn value(&self) -> &SignalValue {
        &self.value
    }
}


pub enum SignalValue {
    Unsigned(u64),
    Signed(i64),
    Real(f64),
}
