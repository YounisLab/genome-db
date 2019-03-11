#!/usr/bin/env python

import sys
import csv
import math
import json

helper = \
'''
Usage: csv2json.py <input.csv> <from_col> <to_col> <output.csv>

Merges from and to columns into a single JSON column and writes to <output.csv>.
<from_column> & <to_column> is 0-indexed, inclusive of <to_column>.
'''

if len(sys.argv) != 5:
  print('Incorrect number of arguments')
  print(helper)
  exit(1)

from_col = int(sys.argv[2])
to_col = int(sys.argv[3])

with open(sys.argv[1]) as in_file, open(sys.argv[4], mode='w') as out_file:
  csv_reader = csv.reader(in_file, delimiter='\t')
  csv_writer = csv.writer(out_file, delimiter='\t', quotechar="'")

  # Append new log2 column to header
  headers = next(csv_reader, None)
  col_names = headers[from_col:to_col + 1]
  csv_writer.writerow(['gene', 'pvalue'])
  for row in csv_reader:
    json_cell = {}

    for index, name in enumerate(col_names):
      val = row[from_col + index]
      if val == "N/A":
        val = "N/A"
      else:
        val = float(val)
      json_cell[name] = val

    json_str = json.dumps(json.dumps(json_cell))
    csv_writer.writerow([row[0], json_str])



