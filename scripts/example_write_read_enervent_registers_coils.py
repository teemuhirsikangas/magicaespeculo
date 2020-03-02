#!/usr/bin/env python

# examples how to write to coil registers 
# https://pymodbus.readthedocs.io/en/v1.3.2/examples/synchronous-client.html

from pymodbus.client.sync import ModbusSerialClient as ModbusClient
import logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusClient(method='rtu', port='/dev/ttyUSB0', timeout=1)
client.connect()

log.debug("Reading Coils")
# starting register, number of registers, slave unit id
rr = client.read_coils(12, 1, unit=0x01)

# read holding registers from register 1 to 45 next ones
hh = client.read_holding_registers(1,45,unit=0x01)

print "holding registers:"
print hh.registers

print "coild register:"
print rr.bits
print("{}: {}".format("summernight cooling status:", rr.bits[0]))


#write coil  
# turn on ylipaineistus/overpressure program
#rq = client.write_coil(10, 1, unit=0x01)

# turn on tehostusohjelma      
rq = client.write_coil(10, 1, unit=0x01)

client.close()
