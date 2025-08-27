import re

def get_gc_content(sequence):
    sequence = sequence.upper()
    gc_count = sequence.count('G') + sequence.count('C')
    valid_bases = len(re.findall(r'[ACGT]', sequence))
    if valid_bases == 0:
        return 0
    gc_content = (gc_count / valid_bases) * 100
    return round(gc_content, 2)

def mutation_check(sequence, mutation_pattern):
    sequence = sequence.upper()
    pattern = mutation_pattern.upper()
    count = sequence.count(pattern)
    return count

def disease_detection(sequence):
    sequence = sequence.upper()
    diseases_found = []

    # Sickle Cell Anemia (GAG -> GTG)
    if 'GTG' in sequence:
        diseases_found.append("Sickle Cell Anemia (GTG mutation)")

    # Huntington's Disease (CAG repeat expansions >= 3 repeats)
    if re.search(r'(CAG){3,}', sequence):
        diseases_found.append("Huntington's Disease (CAG repeat expansion)")

    # Tay-Sachs Disease (TATC Insertion)
    if 'TATC' in sequence:
        diseases_found.append("Tay-Sachs Disease (TATC insertion)")

    # Achondroplasia (GGC -> CGC)
    if 'CGC' in sequence:
        diseases_found.append("Achondroplasia (G380R mutation)")

    return diseases_found

def sequence_similarity(seq1, seq2):
    min_len = min(len(seq1), len(seq2))
    matches = sum(1 for a, b in zip(seq1[:min_len], seq2[:min_len]) if a == b)
    similarity_percentage = (matches / min_len) * 100 if min_len > 0 else 0
    return round(similarity_percentage, 2)

def main():
    print("----- DNA Sequence Analyzer -----")

    # Input DNA Sequences
    seq1 = input("Enter DNA Sequence 1: ").strip()
    seq2 = input("Enter DNA Sequence 2 (optional for comparison): ").strip()

    # GC Content Calculation
    gc_seq1 = get_gc_content(seq1)
    print(f"\nGC Content of Sequence 1: {gc_seq1}%")

    if seq2:
        gc_seq2 = get_gc_content(seq2)
        print(f"GC Content of Sequence 2: {gc_seq2}%")

    # Mutation Check (Custom Pattern)
    mutation = input("\nEnter mutation pattern to detect (e.g., ATG): ").strip()
    mutation_count = mutation_check(seq1, mutation)
    print(f"Occurrences of '{mutation}' in Sequence 1: {mutation_count}")

    # Sequence Similarity Check
    if seq2:
        similarity = sequence_similarity(seq1, seq2)
        print(f"\nSimilarity between Sequence 1 and Sequence 2: {similarity}%")

    # Disease Detection based on known patterns
    diseases = disease_detection(seq1)
    if diseases:
        print("\n--- Potential Disease-Linked Mutations Detected ---")
        for disease in diseases:
            print(f"- {disease}")
    else:
        print("\nNo known disease mutations detected in Sequence 1.")

    print("\n----- Analysis Complete -----")

if __name__ == "__main__":
    main()
