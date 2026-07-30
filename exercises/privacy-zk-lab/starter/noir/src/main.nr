global TREE_DEPTH: u32 = 2;

// TODO 1: tạo note commitment bind secret, salt và amount bằng pedersen_hash.
fn note_commitment(_secret: Field, _salt: Field, _amount: u64) -> Field {
    0
}

// TODO 2: bind nullifier với secret, leaf index và deployment domain.
fn nullifier(_secret: Field, _leaf_index: u8, _domain: Field) -> Field {
    0
}

// TODO 3: hash hai Merkle children theo đúng thứ tự.
fn merkle_node(_left: Field, _right: Field) -> Field {
    0
}

// TODO 4: recompute depth-2 root; dùng hai bits thấp của leaf_index cho left/right.
fn compute_root(_leaf: Field, _leaf_index: u8, _siblings: [Field; TREE_DEPTH]) -> Field {
    0
}

// Private witness không có `pub`; verifier chỉ nhận bốn public inputs cuối.
fn main(
    secret: Field,
    salt: Field,
    input_amount: u64,
    leaf_index: u8,
    siblings: [Field; TREE_DEPTH],
    output_secret: Field,
    output_salt: Field,
    output_amount: u64,
    current_root: pub Field,
    expected_nullifier: pub Field,
    output_commitment: pub Field,
    domain: pub Field,
) {
    // TODO 5: constrain input commitment membership trong current_root.
    // TODO 6: constrain expected_nullifier từ cùng secret/index/domain.
    // TODO 7: conserve value và bind output commitment.
    let _ = (
        note_commitment(secret, salt, input_amount),
        nullifier(secret, leaf_index, domain),
        compute_root(0, leaf_index, siblings),
        merkle_node(current_root, expected_nullifier),
        note_commitment(output_secret, output_salt, output_amount),
        output_commitment,
    );
}
