global TREE_DEPTH: u32 = 2;

fn note_commitment(secret: Field, salt: Field, amount: u64) -> Field {
    std::hash::pedersen_hash([secret, salt, amount as Field])
}

fn nullifier(secret: Field, leaf_index: u8, domain: Field) -> Field {
    std::hash::pedersen_hash([secret, leaf_index as Field, domain])
}

fn merkle_node(left: Field, right: Field) -> Field {
    std::hash::pedersen_hash([left, right])
}

fn compute_root(leaf: Field, leaf_index: u8, siblings: [Field; TREE_DEPTH]) -> Field {
    assert(leaf_index < 4, "leaf index outside depth-2 tree");

    let level_one = if (leaf_index & 1) == 0 {
        merkle_node(leaf, siblings[0])
    } else {
        merkle_node(siblings[0], leaf)
    };

    if (leaf_index & 2) == 0 {
        merkle_node(level_one, siblings[1])
    } else {
        merkle_node(siblings[1], level_one)
    }
}

// Arguments are private by default. Only values marked `pub` are revealed to the verifier.
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
    let input_commitment = note_commitment(secret, salt, input_amount);
    assert_eq(compute_root(input_commitment, leaf_index, siblings), current_root);
    assert_eq(nullifier(secret, leaf_index, domain), expected_nullifier);
    assert_eq(input_amount, output_amount, "value must be conserved");
    assert_eq(
        note_commitment(output_secret, output_salt, output_amount),
        output_commitment,
    );
}

fn valid_fixture() -> (
    Field,
    Field,
    u64,
    u8,
    [Field; TREE_DEPTH],
    Field,
    Field,
    u64,
    Field,
    Field,
    Field,
    Field,
) {
    let secret = 11;
    let salt = 22;
    let amount = 10;
    let leaf_index = 1;
    let output_secret = 33;
    let output_salt = 44;
    let domain = 2026;
    let leaf = note_commitment(secret, salt, amount);
    let siblings = [101, 202];
    let root = compute_root(leaf, leaf_index, siblings);
    let nf = nullifier(secret, leaf_index, domain);
    let output = note_commitment(output_secret, output_salt, amount);
    (
        secret,
        salt,
        amount,
        leaf_index,
        siblings,
        output_secret,
        output_salt,
        amount,
        root,
        nf,
        output,
        domain,
    )
}

#[test]
fn accepts_valid_witness() {
    let f = valid_fixture();
    main(f.0, f.1, f.2, f.3, f.4, f.5, f.6, f.7, f.8, f.9, f.10, f.11);
}

#[test(should_fail)]
fn rejects_wrong_secret() {
    let f = valid_fixture();
    main(99, f.1, f.2, f.3, f.4, f.5, f.6, f.7, f.8, f.9, f.10, f.11);
}

#[test(should_fail)]
fn rejects_wrong_merkle_path() {
    let f = valid_fixture();
    main(f.0, f.1, f.2, f.3, [999, f.4[1]], f.5, f.6, f.7, f.8, f.9, f.10, f.11);
}

#[test(should_fail)]
fn rejects_wrong_root() {
    let f = valid_fixture();
    main(f.0, f.1, f.2, f.3, f.4, f.5, f.6, f.7, 999, f.9, f.10, f.11);
}

#[test(should_fail)]
fn rejects_wrong_nullifier() {
    let f = valid_fixture();
    main(f.0, f.1, f.2, f.3, f.4, f.5, f.6, f.7, f.8, 999, f.10, f.11);
}

#[test(should_fail)]
fn rejects_amount_inflation() {
    let f = valid_fixture();
    main(f.0, f.1, f.2, f.3, f.4, f.5, f.6, 11, f.8, f.9, f.10, f.11);
}
