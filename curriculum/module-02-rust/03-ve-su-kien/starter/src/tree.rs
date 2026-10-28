use sha2::{Digest, Sha256};

pub type Hash = [u8; 32];

#[derive(Clone, Debug)]
pub struct ProofStep {
    sibling: Hash,
    sibling_is_left: bool,
}

// Prefix khác nhau phân biệt dữ liệu leaf với dữ liệu node bên trong.
fn hash_leaf(value: &str) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update([0]);
    hasher.update(value.as_bytes());
    hasher.finalize().into()
}

fn hash_pair(left: &Hash, right: &Hash) -> Hash {
    let mut hasher = Sha256::new();
    hasher.update([1]);
    hasher.update(left);
    hasher.update(right);
    hasher.finalize().into()
}

fn next_level(level: &[Hash]) -> Vec<Hash> {
    level
        .chunks(2)
        .map(|pair| hash_pair(&pair[0], pair.get(1).unwrap_or(&pair[0])))
        .collect()
}

pub fn merkle_root(values: &[&str]) -> Option<Hash> {
    let level: Vec<Hash> = values.iter().map(|value| hash_leaf(value)).collect();
    // TODO 3: đổi level thành mut, lặp next_level đến khi còn một hash.
    level.first().copied()
}

pub fn get_proof(values: &[&str], mut index: usize) -> Option<Vec<ProofStep>> {
    values.get(index)?;
    let mut level: Vec<Hash> = values.iter().map(|value| hash_leaf(value)).collect();
    let mut proof = Vec::new();

    while level.len() > 1 {
        // TODO 4a: index lẻ nghĩa là sibling nằm bên trái.
        let sibling_is_left = false;
        // TODO 4b: chọn index của sibling, không phải chính mình.
        let sibling_index = index;
        let sibling = level.get(sibling_index).unwrap_or(&level[index]);
        proof.push(ProofStep {
            sibling: *sibling,
            sibling_is_left,
        });
        level = next_level(&level);
        index /= 2;
    }
    Some(proof)
}

pub fn verify(value: &str, proof: &[ProofStep], root: &Hash) -> bool {
    let mut current = hash_leaf(value);
    for step in proof {
        current = if step.sibling_is_left {
            // TODO 4c: thứ tự ở hai nhánh này đang bị đảo.
            hash_pair(&current, &step.sibling)
        } else {
            hash_pair(&step.sibling, &current)
        };
    }
    current == *root
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_and_invalid_index_have_no_result() {
        assert_eq!(merkle_root(&[]), None);
        assert!(get_proof(&[], 0).is_none());
        assert!(get_proof(&["Lan"], 1).is_none());
    }

    #[test]
    fn one_leaf_has_empty_proof_and_leaf_root() {
        let root = merkle_root(&["Lan"]).unwrap();
        let proof = get_proof(&["Lan"], 0).unwrap();
        assert_eq!(root, hash_leaf("Lan"));
        assert!(proof.is_empty());
        assert!(verify("Lan", &proof, &root));
        assert!(!verify("Minh", &proof, &root));
    }

    #[test]
    fn root_matches_four_leaves() {
        let values = ["Lan", "Minh", "An", "Bình"];
        let left = hash_pair(&hash_leaf("Lan"), &hash_leaf("Minh"));
        let right = hash_pair(&hash_leaf("An"), &hash_leaf("Bình"));
        assert_eq!(merkle_root(&values), Some(hash_pair(&left, &right)));
    }

    #[test]
    fn proof_has_the_two_expected_siblings() {
        let values = ["Lan", "Minh", "An", "Bình"];
        let right = hash_pair(&hash_leaf("An"), &hash_leaf("Bình"));
        let proof = get_proof(&values, 1).unwrap();
        assert_eq!(proof.len(), 2);
        assert_eq!(proof[0].sibling, hash_leaf("Lan"));
        assert!(proof[0].sibling_is_left);
        assert_eq!(proof[1].sibling, right);
        assert!(!proof[1].sibling_is_left);
    }

    #[test]
    fn every_leaf_verifies_for_even_and_odd_widths() {
        let values = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
        for len in 1..=values.len() {
            let leaves = &values[..len];
            let root = merkle_root(leaves).unwrap();
            for (index, value) in leaves.iter().enumerate() {
                let proof = get_proof(leaves, index).unwrap();
                assert!(verify(value, &proof, &root), "len={len}, index={index}");
                assert!(!verify("sai leaf", &proof, &root));
            }
        }
    }

    #[test]
    fn changed_proof_direction_or_root_is_rejected() {
        let values = ["A", "B", "C", "D"];
        let root = merkle_root(&values).unwrap();
        let proof = get_proof(&values, 1).unwrap();

        let mut wrong_hash = proof.clone();
        wrong_hash[0].sibling[0] ^= 1;
        assert!(!verify("B", &wrong_hash, &root));

        let mut wrong_direction = proof.clone();
        wrong_direction[0].sibling_is_left = false;
        assert!(!verify("B", &wrong_direction, &root));

        let mut wrong_root = root;
        wrong_root[0] ^= 1;
        assert!(!verify("B", &proof, &wrong_root));
    }
}
