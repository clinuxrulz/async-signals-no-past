use std::cell::RefCell;
use std::rc::{Rc, Weak};

pub enum PqRank {
    Pure(i32),
    Effect,
}

pub struct PqElementData {
    pub pq_rank: PqRank,
    pub in_pq: bool,
    pub pq_prev: Weak<dyn PqElement>,
    pub pq_next: Weak<dyn PqElement>,
}

pub trait PqElement {
    fn pq_element_data(&self) -> RefCell<PqElementData>;
}

struct Entry<A> where A: PqElement {
  head: Option<Weak<A>>,
  tail: Option<Weak<A>>,
}

pub struct InstrusiveIndexedPriorityQueue<A> where A: PqElement {
  entries: Vec<Entry<A>>,
  last: Entry<A>,
  min_rank: i32,
  max_rank: i32,
}
