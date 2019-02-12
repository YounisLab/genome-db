#!/usr/bin/env python

import sys
import csv
import math

helper = \
'''
Usage: log2fpkm.py <input.csv> <column> <output.csv>

Computes and appends to <output.csv> the log2 of the values specified in <column>.
<column> is 0-indexed.
'''

if len(sys.argv) != 4:
  print('Incorrect number of arguments')
  print(helper)

fpkmcol = int(sys.argv[2])

with open(sys.argv[1]) as in_file, open(sys.argv[3], mode='w') as out_file:
  csv_reader = csv.reader(in_file, delimiter='\t')
  csv_writer = csv.writer(out_file, delimiter='\t')

  # Append new log2 column to header
  headers = next(csv_reader, None)
  csv_writer.writerow(headers + [headers[fpkmcol] + '_log2'])
  for row in csv_reader:
    fpkm = float(row[fpkmcol])

    if fpkm == 0.0:
      log2fpkm = 'inf'
    else:
      log2fpkm = math.log(fpkm, 2.0)

    csv_writer.writerow(row + [log2fpkm])



