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

fn public_inputs() -> (Field, Field, Field) {
    let leaf = note_commitment(11, 22, 10);
    let root = compute_root(leaf, 1, [101, 202]);
    (root, nullifier(11, 1, 2026), note_commitment(33, 44, 10))
}

#[test]
fn accepts_valid_witness() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, root, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_secret() {
    let (root, nf, output) = public_inputs();
    main(99, 22, 10, 1, [101, 202], 33, 44, 10, root, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_merkle_path() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [999, 202], 33, 44, 10, root, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_root() {
    let (_root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, 999, nf, output, 2026);
}

#[test(should_fail)]
fn rejects_wrong_nullifier() {
    let (root, _nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 10, root, 999, output, 2026);
}

#[test(should_fail)]
fn rejects_amount_inflation() {
    let (root, nf, output) = public_inputs();
    main(11, 22, 10, 1, [101, 202], 33, 44, 11, root, nf, output, 2026);
}

#[test]
fn print_public_inputs() {
    let (root, nf, output) = public_inputs();
    std::println(root);
    std::println(nf);
    std::println(output);
}
