use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(PartialEq, Eq)]
pub enum PqRank {
    Pure(i32),
    Effect,
}

pub struct PqElementData<A> {
    pub pq_rank: PqRank,
    pub in_pq: bool,
    pub pq_prev: Option<Weak<A>>,
    pub pq_next: Option<Rc<A>>,
}

pub trait PqElement where Self: Sized {
    fn pq_element_data(&self) -> RefCell<PqElementData<Self>>;
}

struct Entry<A> where A: PqElement + 'static {
    head: Option<Rc<A>>,
    tail: Option<Rc<A>>,
}

pub struct InstrusiveIndexedPriorityQueue<A> where A: PqElement + 'static {
    entries: Vec<Entry<A>>,
    last: Entry<A>,
    min_rank: i32,
    max_rank: i32,
}

impl<A: PqElement + 'static> InstrusiveIndexedPriorityQueue<A> {
    pub fn new() -> Self {
        const INIT_SIZE: usize = 1000;
        let mut entries = Vec::with_capacity(INIT_SIZE);
        for _i in 0..INIT_SIZE {
            entries.push(Entry {
                head: None,
                tail: None,
            });
        }
        InstrusiveIndexedPriorityQueue {
            entries,
            last: Entry {
                head: None,
                tail: None,
            },
            min_rank: 0,
            max_rank: -1,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.min_rank > self.max_rank && self.last.head.is_none()
    }

    pub fn enqueue(&mut self, a: Rc<A>) {
        let a2 = a.pq_element_data();
        let mut a2 = a2.borrow_mut();
        if a2.in_pq {
            return;
        }
        a2.in_pq = true;
        let entry: &mut Entry<A>;
        match a2.pq_rank {
            PqRank::Effect => {
                entry = &mut self.last;
            },
            PqRank::Pure(rank) => {
                if rank < self.min_rank {
                    self.min_rank = rank;
                }
                if rank > self.max_rank {
                    self.max_rank = rank;
                }
                while self.entries.len() <= rank as usize {
                    self.entries.push(Entry {
                        head: None,
                        tail: None,
                    });
                }
                entry = &mut self.entries[rank as usize];
            },
        }
        if entry.head.is_none() {
            entry.head = Some(Rc::clone(&a));
            entry.tail = Some(a);
            return;
        }
        entry.tail.as_ref().unwrap().pq_element_data().borrow_mut().pq_next = Some(Rc::clone(&a));
        a2.pq_prev = Some(Rc::downgrade(&entry.tail.as_ref().unwrap()))
    }

    pub fn dequeue(&mut self) -> Option<Rc<A>> {
        loop {
            if (self.min_rank > self.max_rank) {
                self.min_rank = 0;
                self.max_rank = -1;
                if self.last.head.is_some() {
                    let result = Rc::clone(self.last.head.as_ref().unwrap());
                    self.remove(&result);
                    return Some(result);
                }
            }
            let entry = self.entries.get_mut(self.min_rank as usize);
            if entry.is_none() || entry.as_ref().unwrap().head.is_none() {
              self.min_rank += 1;
              continue;
            }
            let result = Rc::clone(entry.unwrap().head.as_ref().unwrap());
            self.remove(&result);
            loop {
                let entry = self.entries.get_mut(self.min_rank as usize);
                if entry.is_none() || entry.as_ref().unwrap().head.is_none() {
                    self.min_rank += 1;
                    if self.min_rank > self.max_rank {
                        self.min_rank = 0;
                        self.max_rank = -1;
                        break;
                    }
                }
                break;
            }
            return Some(result);
        }
    }

    pub fn remove(&mut self, a: &Rc<A>) {
        let a2 = a.pq_element_data();
        let mut a2 = a2.borrow_mut();
        if !a2.in_pq {
            return;
        }
        a2.in_pq = true;
        let entry: &mut Entry<A>;
        match a2.pq_rank {
            PqRank::Pure(rank) => {
                entry = &mut self.entries[rank as usize];
            },
            PqRank::Effect => {
                entry = &mut self.last;
            }
        }
        if a2.pq_prev.is_some() {
            a2.pq_prev
                .as_ref()
                .unwrap()
                .upgrade()
                .unwrap()
                .pq_element_data()
                .borrow_mut()
                .pq_next = a2.pq_next.as_ref().map(|x| Rc::clone(x));
        }
        if a2.pq_next.is_some() {
            a2.pq_next
                .as_ref()
                .unwrap()
                .pq_element_data()
                .borrow_mut()
                .pq_prev = a2.pq_prev.as_ref().map(|x| Weak::clone(x));
        }
        if entry.head.is_some() && Rc::ptr_eq(entry.head.as_ref().unwrap(), a) {
            entry.head = a2.pq_next.as_ref().map(|x| Rc::clone(x));
        }
        if entry.tail.is_some() && Rc::ptr_eq(entry.tail.as_ref().unwrap(), a) {
            entry.tail = a2.pq_prev.as_ref().map(|x| x.upgrade().unwrap());
        }
        if entry.head.is_none() {
            entry.tail = None;
        }
        a2.pq_next = None;
        a2.pq_prev = None;
    }

    fn change_rank(&mut self, a: &Rc<A>, new_rank: PqRank) {
        self.remove(&a);
        a.pq_element_data().borrow_mut().pq_rank = new_rank;
        self.enqueue(Rc::clone(a));
    }
}
